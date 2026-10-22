import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, stat } from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";

const runtime = path.resolve(".sites-runtime");
await mkdir(runtime, { recursive: true });
const directory = await mkdtemp(path.join(runtime, "verification-"));
let child;
let base;
let passed = 0;
async function start() {
  child = spawn(process.execPath, ["scripts/local-server.mjs", "--production", "--port", "0"], {
    cwd: process.cwd(), env: { ...process.env, BIRTHDAY_DATA_DIR: directory, HOST: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server did not start")), 15000);
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; const match = output.match(/Local: (http:\/\/127\.0\.0\.1:\d+)\//); if (match) { clearTimeout(timer); resolve(match[1]); } });
    child.stderr.on("data", chunk => { output += chunk; });
    child.once("exit", code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}: ${output}`)); });
  });
}
async function stop() { if (child && child.exitCode === null) { const exited = once(child, "exit"); child.kill("SIGTERM"); await exited; } }
async function request(route, method = "GET", body, token, origin) {
  const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(token ? { "X-Edit-Token": token } : {}), ...(origin ? { Origin: origin } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json() };
}
function check(label, fn) { fn(); passed++; console.log(`PASS ${label}`); }
try {
  await start();
  const page = await fetch(base);
  check("Production page serves successfully", () => assert.equal(page.status, 200));
  const config = { name: "测试寿星", birthday: "2026-10-22", age: 22, sender: "测试朋友", blessing: "愿快乐与温柔常伴你。\n\n这是一次独立测试。", theme: "cherry" };
  const invalid = await request("/api/celebrations", "POST", { ...config, birthday: "2026-02-30" });
  check("Invalid calendar dates are rejected", () => assert.equal(invalid.status, 400));
  const created = await request("/api/celebrations", "POST", config);
  check("Configuration is saved", () => { assert.equal(created.status, 201); assert.equal(created.data.celebration.name, config.name); assert.ok(created.data.editToken); });
  const id = created.data.celebration.id;
  const token = created.data.editToken;
  const route = `/api/celebrations/${id}`;
  const read = await request(route);
  check("Public response never exposes edit credentials", () => { assert.deepEqual(read.data.celebration, { ...config, id }); assert.ok(!JSON.stringify(read.data).includes(token)); assert.ok(!JSON.stringify(read.data).includes("editTokenHash")); });
  const denied = await request(route, "PATCH", { ...config, name: "不允许的改动" });
  const wrong = await request(route, "PATCH", config, "incorrect-token");
  check("Unauthorised edits are blocked", () => { assert.equal(denied.status, 403); assert.equal(wrong.status, 403); });
  const updated = await request(route, "PATCH", { ...config, theme: "matcha" }, token);
  check("Creator can update the page", () => { assert.equal(updated.status, 200); assert.equal(updated.data.celebration.theme, "matcha"); });
  const foreign = await request(route + "/messages", "POST", {}, undefined, "https://untrusted.example");
  check("Cross-origin writes are blocked", () => assert.equal(foreign.status, 403));
  const message = { id: crypto.randomUUID(), name: "测试朋友", content: '<script>alert("不会执行")</script> 生日快乐！', kind: "message", color: "sage" };
  const posted = await request(route + "/messages", "POST", message);
  const retried = await request(route + "/messages", "POST", message);
  const list = await request(route + "/messages");
  check("Message saved exactly once across retries", () => { assert.equal(posted.status, 201); assert.equal(retried.status, 200); assert.equal(list.data.allTotal, 1); assert.equal(list.data.messages[0].content, message.content); });
  const conflict = await request(route + "/messages", "POST", { ...message, content: "不同的内容" });
  check("Reusing a submission ID for new content is rejected", () => assert.equal(conflict.status, 409));
  const empty = await request(route + "/messages", "POST", { ...message, id: crypto.randomUUID(), content: "   " });
  const overlong = await request(route + "/messages", "POST", { ...message, id: crypto.randomUUID(), content: "爱".repeat(301) });
  check("Empty and overlong messages are rejected", () => { assert.equal(empty.status, 400); assert.equal(overlong.status, 400); });
  for (let i = 0; i < 7; i++) {
    const saved = await request(route + "/messages", "POST", { ...message, id: crypto.randomUUID(), content: `测试心愿 ${i + 1}`, kind: "wish" });
    assert.equal(saved.status, 201);
  }
  const paged = await request(route + "/messages?kind=wish&offset=6");
  check("Pagination and wish filtering work", () => { assert.equal(paged.data.total, 7); assert.equal(paged.data.messages.length, 1); assert.equal(paged.data.hasMore, false); assert.equal(paged.data.messages[0].kind, "wish"); });
  const limited = await request(route + "/messages", "POST", { ...message, id: crypto.randomUUID() });
  check("Rapid message spam is rate-limited", () => assert.equal(limited.status, 429));
  const demo = await request("/api/celebrations/demo/messages");
  check("Birthday pages have isolated message walls", () => assert.equal(demo.data.allTotal, 0));
  const missing = await request("/api/celebrations/not-a-real-board");
  check("Unknown birthday links return 404", () => assert.equal(missing.status, 404));
  await stop();
  await start();
  const restored = await request(route);
  const restoredMessages = await request(route + "/messages");
  check("Configuration and messages survive a server restart", () => { assert.equal(restored.data.celebration.theme, "matcha"); assert.equal(restoredMessages.data.allTotal, 8); });
  const db = await stat(path.join(directory, "birthday.sqlite"));
  check("Data exists in a persistent server-side SQLite file", () => assert.ok(db.size > 0));
  console.log(`\n${passed} verification checks passed.`);
} finally {
  await stop();
  // Only this verification's explicitly created isolated database may be removed.
  assert.ok(directory.startsWith(runtime + path.sep + "verification-"));
  await rm(directory, { recursive: true, force: true });
}
