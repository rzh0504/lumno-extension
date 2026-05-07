const fs = require('fs');
const path = require('path');

const DEFAULT_ROOTS = ['src'];
const INCLUDED_EXTENSIONS = new Set(['.js', '.html', '.css']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git']);

function walk(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    return INCLUDED_EXTENSIONS.has(path.extname(root)) ? [root] : [];
  }
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    if (IGNORED_DIRS.has(entry.name)) {
      return;
    }
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      return;
    }
    if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  });
  return files;
}

function countMatches(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function countSetPropertyImportant(source) {
  return countMatches(
    source,
    /\.style\.setProperty\s*\([\s\S]*?['"]important['"][\s\S]*?\)/g
  );
}

function auditFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  return {
    file,
    lines: source.split(/\r?\n/).length,
    important: countMatches(source, /!important/g),
    setPropertyImportant: countSetPropertyImportant(source),
    cssText: countMatches(source, /\.style\.cssText/g),
    styleWrites: countMatches(source, /\.style\./g),
    createElement: countMatches(source, /createElement\s*\(/g)
  };
}

function printTable(rows) {
  rows.forEach((row) => {
    console.log(
      `${row.file} lines=${row.lines}` +
      ` important=${row.important}` +
      ` setPropertyImportant=${row.setPropertyImportant}` +
      ` cssText=${row.cssText}` +
      ` styleWrites=${row.styleWrites}` +
      ` createElement=${row.createElement}`
    );
  });
}

function printTotals(rows) {
  const totals = rows.reduce((next, row) => ({
    files: next.files + 1,
    lines: next.lines + row.lines,
    important: next.important + row.important,
    setPropertyImportant: next.setPropertyImportant + row.setPropertyImportant,
    cssText: next.cssText + row.cssText,
    styleWrites: next.styleWrites + row.styleWrites,
    createElement: next.createElement + row.createElement
  }), {
    files: 0,
    lines: 0,
    important: 0,
    setPropertyImportant: 0,
    cssText: 0,
    styleWrites: 0,
    createElement: 0
  });
  console.log(
    `TOTAL files=${totals.files}` +
    ` lines=${totals.lines}` +
    ` important=${totals.important}` +
    ` setPropertyImportant=${totals.setPropertyImportant}` +
    ` cssText=${totals.cssText}` +
    ` styleWrites=${totals.styleWrites}` +
    ` createElement=${totals.createElement}`
  );
}

const roots = process.argv.slice(2);
const scanRoots = roots.length > 0 ? roots : DEFAULT_ROOTS;
const rows = scanRoots
  .flatMap(walk)
  .map((file) => path.normalize(file))
  .filter((file, index, list) => list.indexOf(file) === index)
  .sort()
  .map(auditFile);

printTable(rows);
printTotals(rows);
