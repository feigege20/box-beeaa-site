// scripts/_clean_dist.mjs - Force clean dist/ before build (workaround Pages build_caching 6-day trap)
// 2026-08-12: Pages build_caching 复用 8/11 dist artifact,新 src/ 改动无效
// build_command 在 .functions/PAGES_BUILD 里调它
import { rmSync, existsSync } from "node:fs";
const dist = "dist";
if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
  console.log(`[CLEAN] removed ${dist}/`);
} else {
  console.log(`[CLEAN] ${dist}/ not found, skip`);
}
