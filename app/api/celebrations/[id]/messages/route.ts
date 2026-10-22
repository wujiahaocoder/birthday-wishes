import { and, eq, desc, gte, count } from "drizzle-orm";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { messageSchema } from "@/lib/celebration";
import { findCelebration, json, readBody, hash, sameOrigin, fail } from "@/lib/server";

type Context = { params: Promise<{ id: string }> };
const publicFields = { id: messages.id, name: messages.name, content: messages.content, kind: messages.kind, color: messages.color, createdAt: messages.createdAt };
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!await findCelebration(id)) return json({ error: "这份祝福不存在" }, 404);
    const params = new URL(request.url).searchParams;
    const rawOffset = Number(params.get("offset") || "0");
    if (!Number.isSafeInteger(rawOffset) || rawOffset < 0 || rawOffset > 100000) return json({ error: "页码不正确" }, 400);
    const kind = params.get("kind");
    const condition = kind === "wish" || kind === "message" ? and(eq(messages.celebrationId, id), eq(messages.kind, kind)) : eq(messages.celebrationId, id);
    const db = getDb();
    const [rows, totals, allTotals] = await Promise.all([
      db.select(publicFields).from(messages).where(condition).orderBy(desc(messages.createdAt), desc(messages.id)).limit(6).offset(rawOffset),
      db.select({ total: count() }).from(messages).where(condition),
      db.select({ total: count() }).from(messages).where(eq(messages.celebrationId, id)),
    ]);
    return json({ messages: rows, total: totals[0].total, allTotal: allTotals[0].total, hasMore: rawOffset + rows.length < totals[0].total });
  } catch (e) { return fail(e); }
}
export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return json({ error: "请在生日页面内留言" }, 403);
  let body: unknown;
  try { body = await readBody(request); } catch (e) { return json({ error: (e as Error).message }, 400); }
  const result = messageSchema.safeParse(body);
  if (!result.success) return json({ error: result.error.issues[0].message }, 400);
  try {
    const { id } = await context.params;
    if (!await findCelebration(id)) return json({ error: "这份祝福不存在" }, 404);
    const db = getDb();
    const [existing] = await db.select({ ...publicFields, celebrationId: messages.celebrationId }).from(messages).where(eq(messages.id, result.data.id)).limit(1);
    const matches = (row: typeof existing) => row.celebrationId === id && row.name === result.data.name && row.content === result.data.content && row.kind === result.data.kind && row.color === result.data.color;
    if (existing) {
      if (!matches(existing)) return json({ error: "这次提交的标记已被使用，请重新提交" }, 409);
      const { celebrationId: _board, ...message } = existing;
      return json({ message });
    }
    const senderHash = await hash(id + ":" + (request.headers.get("cf-connecting-ip") || "local-preview"));
    const [{ total }] = await db.select({ total: count() }).from(messages).where(and(eq(messages.senderHash, senderHash), gte(messages.createdAt, new Date(Date.now() - 60000).toISOString())));
    if (total >= 8) return json({ error: "心意已经收到很多啦，休息一分钟再来吧" }, 429);
    const { website: _website, ...data } = result.data;
    const message = { ...data, createdAt: new Date().toISOString() };
    const inserted = await db.insert(messages).values({ ...message, celebrationId: id, senderHash }).onConflictDoNothing().returning(publicFields);
    if (inserted.length) return json({ message: inserted[0] }, 201);
    const [conflict] = await db.select({ ...publicFields, celebrationId: messages.celebrationId }).from(messages).where(eq(messages.id, result.data.id)).limit(1);
    if (!conflict || !matches(conflict)) return json({ error: "这次提交的标记已被使用，请重新提交" }, 409);
    const { celebrationId: _board, ...stored } = conflict;
    return json({ message: stored });
  } catch (e) { return fail(e); }
}
