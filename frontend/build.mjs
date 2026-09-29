// Build the panel and the card into custom_components/heating_scheduler/dist.
// Both entries share one chunk, so every custom element is defined once.
import { build, context } from "esbuild";
import { rm, mkdir } from "node:fs/promises";

const outdir = new URL("../custom_components/heating_scheduler/dist/", import.meta.url).pathname;
const watch = process.argv.includes("--watch");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const options = {
  entryPoints: {
    "heating-scheduler-panel": "src/panel.ts",
    "heating-scheduler-card": "src/card.ts",
  },
  outdir,
  bundle: true,
  splitting: true,
  format: "esm",
  target: "es2022",
  minify: !watch,
  legalComments: "none",
  chunkNames: "chunks/[name]-[hash]",
  logLevel: "info",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
