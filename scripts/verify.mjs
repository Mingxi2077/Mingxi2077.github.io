import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const script = await readFile(resolve(root, "js/main.js"), "utf8");
const readme = await readFile(resolve(root, "README.md"), "utf8");
const failures = [];

function matches(source, pattern) {
  return Array.from(source.matchAll(pattern));
}

const ids = matches(html, /\bid="([^"]+)"/g).map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) failures.push(`重复 ID：${[...new Set(duplicateIds)].join("、")}`);

for (const match of matches(html, /href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) failures.push(`站内锚点不存在：#${match[1]}`);
}

for (const match of matches(html, /<img\b[^>]*>/g)) {
  if (!/\balt="[^"]*"/.test(match[0])) failures.push(`图片缺少 alt：${match[0]}`);
}

for (const match of matches(html, /<a\b[^>]*target="_blank"[^>]*>/g)) {
  if (!/\brel="[^"]*noopener[^"]*"/.test(match[0])) failures.push(`新窗口链接缺少 noopener：${match[0]}`);
}

const resourcePaths = new Set([
  ...matches(html, /(?:src|href)="((?:assets|css|js)\/[^"?#]+)[^"]*"/g).map((match) => match[1]),
  ...matches(script, /"(assets\/[^"?#]+)"/g).map((match) => match[1])
]);

for (const resourcePath of resourcePaths) {
  try {
    await access(resolve(root, resourcePath));
  } catch {
    failures.push(`内部资源不存在：${resourcePath}`);
  }
}

const galleryCount = matches(html, /class="g-item reveal"/g).length;
if (galleryCount !== 29) failures.push(`绘卷数量应为 29，当前为 ${galleryCount}`);
if (!readme.includes("29 张游戏原版 CG")) failures.push("README 未同步 29 张绘卷");
if (!readme.includes("真夜、夏目")) failures.push("README 未同步角色名“夏目”");
if (!html.includes("01 / 29")) failures.push("灯箱初始计数未同步为 29");

if (failures.length) {
  console.error("验证失败：");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`验证通过：${resourcePaths.size} 个内部资源、${ids.length} 个 ID、${galleryCount} 张绘卷。`);
}

