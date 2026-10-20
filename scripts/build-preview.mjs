import { build } from "vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
await build({
  configFile: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  root: projectRoot,
  base: "./",
  build: {
    outDir: "preview",
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("../src/main.js", import.meta.url)),
      name: "O2ODemo",
      formats: ["iife"],
      fileName: () => "o2o.js",
      cssFileName: "o2o",
    },
  },
});
