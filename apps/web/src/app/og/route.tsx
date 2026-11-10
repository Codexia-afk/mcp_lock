import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#111820",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 800, color: "#F7F8F5", letterSpacing: "-0.03em" }}>mcp-lock</div>
        <div style={{ fontSize: 32, color: "#B8F568", marginTop: 18, fontWeight: 600 }}>Know what your AI tools actually do</div>
        <div style={{ fontSize: 20, color: "#9AA7B4", marginTop: 14 }}>The behavioral lockfile for MCP servers</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
  return image;
}
