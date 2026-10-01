// Build the frontend into custom_components/heating_scheduler/dist:
// - heating-scheduler-panel.js: the main bundle (panel, card, components);
// - heating-scheduler-card.js: the small card loader, a dashboard resource;
// - heating-scheduler-icons.js: the sidebar icon, an extra module on every page.
// They share no chunk: the loader always imports the main bundle by its current URL.
import { build, context } from "esbuild";
import { rm, mkdir } from "node:fs/promises";

const outdir = new URL("../custom_components/heating_scheduler/dist/", import.meta.url).pathname;
const watch = process.argv.includes("--watch");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const common = {
  outdir,
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: !watch,
  legalComments: "none",
  logLevel: "info",
};
const builds = [
  { ...common, entryPoints: { "heating-scheduler-panel": "src/panel.ts" } },
  { ...common, entryPoints: { "heating-scheduler-card": "src/card-loader.ts" } },
  { ...common, entryPoints: { "heating-scheduler-icons": "src/sidebar-icons.ts" } },
];

if (watch) {
  for (const options of builds) await (await context(options)).watch();
} else {
  await Promise.all(builds.map((options) => build(options)));
}
