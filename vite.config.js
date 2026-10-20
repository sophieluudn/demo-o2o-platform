import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  plugins: [{
    name: "local-preview-entry",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(
          /<!-- local-preview:start -->[\s\S]*?<!-- local-preview:end -->/,
          '<script type="module" src="./src/main.js"></script>',
        );
      },
    },
  }],
});
