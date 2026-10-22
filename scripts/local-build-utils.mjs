import { build } from "esbuild";
import path from "node:path";
export async function bundleApi(output) {
  await build({ entryPoints: ["server/api.ts"], outfile: output, bundle: true, platform: "node", target: "node22", format: "esm", alias: { "cloudflare:workers": path.resolve("server/local-database.mjs") }, logLevel: "warning" });
}
