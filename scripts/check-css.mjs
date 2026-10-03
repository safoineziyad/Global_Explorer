#!/usr/bin/env node
/**
 * check-css.mjs
 *
 * Lightweight CSS/style quality gate.
 *
 * Primary rule: `opacity:` must not be used to de-emphasise content
 * (use explicit colour tokens instead). This applies to .css files as well
 * as inline styles in .ts/.tsx/.jsx files.
 *
 * Basic checks: `!important` and `transition: all` are also rejected.
 *
 * Exits non-zero when any violation is found.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const SCAN_EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.jsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'coverage']);

const violations = [];

function record(filePath, line, column, rule, message, content) {
  violations.push({
    file: path.relative(rootDir, filePath),
    line,
    column,
    rule,
    message,
    content: content.trim(),
  });
}

function isCommentLine(trimmed, inBlockComment) {
  if (inBlockComment) return true;
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

function checkCss(filePath, content) {
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const startBlock = line.includes('/*');
    const endBlock = line.includes('*/');

    if (!isCommentLine(trimmed, inBlockComment)) {
      const opacity = /(^|[^-\w])opacity\s*:/i.exec(line);
      if (opacity) {
        record(filePath, i + 1, opacity.index + 1, 'no-opacity', 'opacity: is not allowed (de-emphasis)', line);
      }

      const important = /\s*!important\b/.exec(line);
      if (important) {
        record(filePath, i + 1, important.index + 1, 'no-important', '!important is not allowed', line);
      }

      const transitionAll = /transition(-property)?\s*:\s*all\b/i.exec(line);
      if (transitionAll) {
        record(filePath, i + 1, transitionAll.index + 1, 'no-transition-all', 'transition: all is not allowed', line);
      }
    }

    if (startBlock && !endBlock) inBlockComment = true;
    if (endBlock) inBlockComment = false;
  }
}

function checkSource(filePath, content) {
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const startBlock = line.includes('/*');
    const endBlock = line.includes('*/');

    if (!isCommentLine(trimmed, inBlockComment)) {
      // Inline style opacity: `opacity: 0.8` inside a style object.
      const opacity = /(^|[^-\w])opacity\s*:/i.exec(line);
      if (opacity) {
        record(filePath, i + 1, opacity.index + 1, 'no-opacity', 'opacity: is not allowed (de-emphasis)', line);
      }
    }

    if (startBlock && !endBlock) inBlockComment = true;
    if (endBlock) inBlockComment = false;
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!SCAN_EXTENSIONS.has(ext)) continue;
      let content;
      try {
        content = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (ext === '.css') checkCss(full, content);
      else checkSource(full, content);
    }
  }
}

function main() {
  if (!fs.existsSync(srcDir)) {
    console.log('CSS quality check passed (no src directory found)');
    return;
  }

  walk(srcDir);

  if (violations.length === 0) {
    console.log('CSS quality check passed');
    return;
  }

  console.error(`CSS quality check failed: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}:${v.column} [${v.rule}] ${v.message}`);
    console.error(`    ${v.content}`);
  }
  process.exit(1);
}

main();
