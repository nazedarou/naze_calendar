import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get("size") ?? "192")));
  return new ImageResponse(
    (
      <div
        style={{
          background: "#8B6649",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#FDF9F5", fontSize: Math.round(size * 0.58), fontWeight: 700 }}>
          F
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
