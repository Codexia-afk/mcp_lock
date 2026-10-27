package config

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
)

// ScenarioDigest hashes the ordered scenario inputs and selected protocol era.
// JSON object key order and whitespace inside arguments do not affect it.
func (c Config) ScenarioDigest() (string, error) {
	if err := c.Validate(); err != nil {
		return "", err
	}
	type scenario struct {
		Name       string         `json:"name"`
		Tool       string         `json:"tool"`
		Arguments  map[string]any `json:"arguments"`
		ExpectText string         `json:"expectText"`
	}
	canonical := struct {
		ProtocolMode string     `json:"protocolMode"`
		Scenarios    []scenario `json:"scenarios"`
	}{ProtocolMode: c.ProtocolMode, Scenarios: make([]scenario, 0, len(c.Scenarios))}
	for _, s := range c.Scenarios {
		var args map[string]any
		decoder := json.NewDecoder(bytes.NewReader(s.Arguments))
		decoder.UseNumber()
		if err := decoder.Decode(&args); err != nil {
			return "", err
		}
		canonical.Scenarios = append(canonical.Scenarios, scenario{Name: s.Name, Tool: s.Tool, Arguments: args, ExpectText: s.ExpectText})
	}
	b, err := json.Marshal(canonical)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(b)
	return "sha256:" + hex.EncodeToString(sum[:]), nil
}

// FixtureDigest hashes the paths, permissions and bytes of explicit read-only
// fixture mounts. A production scan must snapshot these fixtures before launch.
func (c Config) FixtureDigest() (string, error) {
	if err := c.Validate(); err != nil {
		return "", err
	}
	h := sha256.New()
	mounts := append([]FixtureMount(nil), c.FixtureMounts...)
	sort.Slice(mounts, func(i, j int) bool { return mounts[i].Target < mounts[j].Target })
	var total int64
	var files int
	for _, mount := range mounts {
		writePart(h, []byte(mount.Target))
		root := mount.Source
		err := filepath.WalkDir(root, func(name string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			info, err := entry.Info()
			if err != nil {
				return err
			}
			if info.Mode()&os.ModeSymlink != 0 {
				return fmt.Errorf("fixture symlink %q is not allowed", name)
			}
			if !entry.IsDir() && !info.Mode().IsRegular() {
				return fmt.Errorf("special fixture file %q is not allowed", name)
			}
			rel, err := filepath.Rel(root, name)
			if err != nil {
				return err
			}
			writePart(h, []byte(filepath.ToSlash(rel)))
			writePart(h, []byte(info.Mode().Perm().String()))
			if entry.IsDir() {
				writePart(h, []byte("directory"))
				return nil
			}
			files++
			if files > 10000 {
				return errors.New("too many fixture files")
			}
			if info.Size() > 64<<20 || total+info.Size() > 256<<20 {
				return errors.New("fixture size limit exceeded")
			}
			total += info.Size()
			writePart(h, []byte("file"))
			f, err := os.Open(name)
			if err != nil {
				return err
			}
			defer f.Close()
			var size [8]byte
			binary.BigEndian.PutUint64(size[:], uint64(info.Size()))
			_, _ = h.Write(size[:])
			n, err := io.CopyN(h, f, info.Size())
			if err != nil {
				return err
			}
			if n != info.Size() {
				return errors.New("fixture changed while hashing")
			}
			return nil
		})
		if err != nil {
			return "", err
		}
	}
	return "sha256:" + hex.EncodeToString(h.Sum(nil)), nil
}

func writePart(h hash.Hash, part []byte) {
	var size [8]byte
	binary.BigEndian.PutUint64(size[:], uint64(len(part)))
	_, _ = h.Write(size[:])
	_, _ = h.Write(part)
}
