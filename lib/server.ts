import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { celebrations } from "@/db/schema";
import { defaultCelebration } from "@/lib/celebration";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("请使用正确的提交格式");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("提交内容为空");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    length += result.value.length;
    if (length > 16000) { await reader.cancel(); throw new Error("内容太长啦，请精简后重试"); }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error("提交格式有误，请重试"); }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
export async function hash(text: string) {
  const data = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(data), b => b.toString(16).padStart(2, "0")).join("");
}
export async function findCelebration(id: string) {
  if (id === "demo") return defaultCelebration;
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const [row] = await getDb().select().from(celebrations).where(eq(celebrations.id, id)).limit(1);
  if (!row) return null;
  const { editTokenHash: _token, createdAt: _created, updatedAt: _updated, ...publicConfig } = row;
  return publicConfig;
}
export function fail(error: unknown) {
  console.error("Birthday request failed", error);
  return json({ error: "暂时没能保存这份心意，请稍后重试。你填写的内容会保留。" }, 500);
}
