import { spawn } from "node:child_process";
const port = Number(process.env.PORT || 5173);
const url = `http://127.0.0.1:${port}/`;
function openBrowser() {
  const command = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], { stdio: "ignore", windowsHide: true, detached: true });
  child.on("error", () => console.log(`请在浏览器打开 ${url}`)); child.unref();
}
let running = false;
try {
  const response = await fetch(url + "api/celebrations/demo", { signal: AbortSignal.timeout(1200) });
  const data = await response.json(); running = data?.celebration?.id === "demo";
} catch { /* No existing Birthday Studio server. */ }
if (running) { console.log(`生日祝福页面已在运行：${url}`); openBrowser(); }
else {
  await import("./local-server.mjs");
  // The server starts in this same terminal; closing it stops the local service.
  openBrowser();
}
