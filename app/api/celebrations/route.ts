import { getDb } from "@/db";
import { celebrations } from "@/db/schema";
import { configSchema } from "@/lib/celebration";
import { json, readBody, hash, sameOrigin, fail } from "@/lib/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "请在生日页面内提交" }, 403);
  let body: unknown;
  try { body = await readBody(request); } catch (e) { return json({ error: (e as Error).message }, 400); }
  const result = configSchema.safeParse(body);
  if (!result.success) return json({ error: result.error.issues[0].message }, 400);
  try {
    const id = crypto.randomUUID();
    const editToken = crypto.randomUUID() + crypto.randomUUID();
    const now = new Date().toISOString();
    await getDb().insert(celebrations).values({ ...result.data, id, editTokenHash: await hash(editToken), createdAt: now, updatedAt: now });
    return json({ celebration: { ...result.data, id }, editToken }, 201);
  } catch (e) { return fail(e); }
}
