import { NextResponse } from "next/server";
import { getDraftArticles } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const drafts = await getDraftArticles();
    return NextResponse.json(drafts);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
