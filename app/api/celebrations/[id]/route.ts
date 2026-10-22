import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { celebrations } from "@/db/schema";
import { configSchema } from "@/lib/celebration";
import { findCelebration, json, readBody, hash, sameOrigin, fail } from "@/lib/server";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const board = await findCelebration((await context.params).id);
    return board ? json({ celebration: board }) : json({ error: "没有找到这份祝福，请确认链接是否完整" }, 404);
  } catch (e) { return fail(e); }
}
export async function PATCH(request: Request, context: Context) {
  if (!sameOrigin(request)) return json({ error: "请在生日页面内提交" }, 403);
  const { id } = await context.params;
  const token = request.headers.get("X-Edit-Token");
  if (!token || token.length > 100 || id === "demo") return json({ error: "这份祝福只能由创建者修改。你可以制作一份新的祝福。" }, 403);
  let body: unknown;
  try { body = await readBody(request); } catch (e) { return json({ error: (e as Error).message }, 400); }
  const result = configSchema.safeParse(body);
  if (!result.success) return json({ error: result.error.issues[0].message }, 400);
  try {
    const updated = await getDb().update(celebrations).set({ ...result.data, updatedAt: new Date().toISOString() })
      .where(and(eq(celebrations.id, id), eq(celebrations.editTokenHash, await hash(token)))).returning({ id: celebrations.id });
    if (!updated.length) return json({ error: "无法修改这份祝福，请使用创建它的浏览器" }, 403);
    return json({ celebration: { ...result.data, id } });
  } catch (e) { return fail(e); }
}
