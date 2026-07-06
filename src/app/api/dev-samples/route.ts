import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const report = typeof body?.report === "string" ? body.report : "";
    const append = Boolean(body?.append);
    if (!report) {
      return NextResponse.json(
        { ok: false, error: "Missing report content." },
        { status: 400 }
      );
    }

    const rawMode = typeof body?.mode === "string" ? body.mode : "unknown";
    const safeMode = rawMode.replace(/[^a-z0-9_-]/gi, "") || "unknown";
    const rawFilename = typeof body?.filename === "string" ? body.filename : "";
    const safeFilename =
      rawFilename.replace(/[^a-z0-9._-]/gi, "").replace(/^\.+/, "");
    const filename = safeFilename || `dev-samples-${safeMode}.txt`;
    const filePath = path.join(process.cwd(), filename);
    if (append) {
      await fs.appendFile(filePath, report, "utf8");
    } else {
      await fs.writeFile(filePath, report, "utf8");
    }

    return NextResponse.json({
      ok: true,
      path: filename,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
