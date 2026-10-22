import { build } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { bundleApi } from "./local-build-utils.mjs";
await build({ configFile: false, root: process.cwd(), plugins: [react()], resolve: { alias: { "@": process.cwd() } }, build: { outDir: "dist/local", emptyOutDir: true } });
await bundleApi(path.resolve("dist/local-server/api.mjs"));
