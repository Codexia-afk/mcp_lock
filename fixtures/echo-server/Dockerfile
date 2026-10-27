# Protocol-only fixture image with a pinned build base.
FROM golang:1.26-alpine@sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308 AS build
WORKDIR /src
COPY go.mod ./
COPY fixtures/echo-server/main.go ./main.go
RUN CGO_ENABLED=0 go build -trimpath -o /out/echo-server ./main.go

FROM scratch
COPY --from=build /out/echo-server /app/server
ARG VERSION=baseline
ENV MCP_LOCK_FIXTURE_VERSION=${VERSION}
USER 65532:65532
ENTRYPOINT ["/app/server"]
