import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(1).max(128),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(60),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(80),
  description: z.string().trim().max(500).optional(),
});

export const serverSchema = z.object({
  name: z.string().trim().min(1, "Server name is required").max(80),
  packageName: z.string().trim().max(200).optional(),
  version: z.string().trim().max(64).optional(),
  source: z.string().trim().max(500).optional(),
  projectId: z.string().min(1, "Project is required"),
  imageDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/, "Image digest must be a sha256 digest").optional(),
});

export const scanIngestSchema = z.object({
  serverId: z.string().min(1, "Server is required"),
  status: z.enum(["completed", "incomplete", "failed"]).optional(),
  backend: z.string().min(1).optional(),
  events: z.array(z.object({
    kind: z.string().min(1),
    target: z.string().min(1),
    objectDigest: z.string().optional(),
    outcome: z.enum(["allowed", "denied"]),
    scenario: z.string().min(1),
    count: z.number().int().min(1),
  })).max(500).optional(),
});

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  source: z.string().trim().max(80).optional(),
});

export const lockfileVersionSchema = z.object({
  version: z.string().min(1).max(32),
});
