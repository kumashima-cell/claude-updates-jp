import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分

export async function GET(request: Request) {
  // Vercel Cronからの認証チェック
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPipeline();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
