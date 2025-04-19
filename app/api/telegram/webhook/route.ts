import { NextResponse } from "next/server"
import { handleUpdate } from "@/lib/telegram"

export async function POST(request: Request) {
  try {
    const update = await request.json()
    await handleUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error handling Telegram webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
