import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { bundleApi } from "./local-build-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const production = process.argv.includes("--production");
const portArg = process.argv.indexOf("--port");
const port = Number(portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const apiPath = path.join(root, production ? "dist/local-server/api.mjs" : ".sites-runtime/local-api.mjs");
if (!production) await bundleApi(apiPath);
if (!existsSync(apiPath)) throw new Error("Run npm run build:local before starting production.");
const api = await import(pathToFileURL(apiPath).href);
let vite;
if (!production) {
  const { createServer: createViteServer } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  vite = await createViteServer({ configFile: false, root, plugins: [react()], resolve: { alias: { "@": root } }, server: { middlewareMode: true }, appType: "spa" });
}
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      const match = url.pathname.match(/^\/api\/celebrations(?:\/([a-zA-Z0-9-]+)(\/messages)?)?$/);
      if (!match) { res.writeHead(404, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "接口不存在" })); return; }
      const route = !match[1] ? { POST: api.createCelebration } : match[2] ? { GET: api.listMessages, POST: api.createMessage } : { GET: api.getCelebration, PATCH: api.updateCelebration };
      const handler = route[req.method];
      if (!handler) { res.writeHead(405, { Allow: Object.keys(route).join(", ") }); res.end(); return; }
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 16000) { res.writeHead(413, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "内容太长，请精简后再试" })); return; } chunks.push(chunk); }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      headers.set("cf-connecting-ip", req.socket.remoteAddress || "local");
      const request = new Request(url, { method: req.method, headers, ...(size ? { body: Buffer.concat(chunks) } : {}) });
      const response = await handler(request, { params: Promise.resolve({ id: match[1] }) });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    if (vite) { vite.middlewares(req, res); return; }
    const publicRoot = path.join(root, "dist/local");
    const requested = path.resolve(publicRoot, "." + decodeURIComponent(url.pathname));
    if (!requested.startsWith(publicRoot + path.sep) && requested !== publicRoot) { res.writeHead(403); res.end(); return; }
    let file = requested;
    try { if (!(await stat(file)).isFile()) file = path.join(publicRoot, "index.html"); }
    catch { if (path.extname(file)) { res.writeHead(404); res.end(); return; } file = path.join(publicRoot, "index.html"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": file.includes(path.sep + "assets" + path.sep) ? "public, max-age=31536000, immutable" : "no-cache" });
    res.end(await readFile(file));
  } catch (error) { console.error("Local server request failed", error); if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "服务暂时不可用，请稍后重试" })); }
});
server.listen(port, host, () => console.log(`\n  今日偏爱 · Birthday Studio\n  Local: http://${host}:${server.address().port}/\n  Storage: ${path.join(process.env.BIRTHDAY_DATA_DIR || path.join(root, "data"), "birthday.sqlite")}\n`));
async function shutdown() { server.close(); await vite?.close(); api.closeDb(); process.exit(0); }
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
