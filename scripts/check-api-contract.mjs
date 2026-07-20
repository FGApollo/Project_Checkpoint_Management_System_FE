import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = path.resolve('src');
const swaggerUrl = process.env.CPMS_SWAGGER_URL || 'https://swd-capstone.onrender.com/swagger/v1/swagger.json';

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return nested.flat().filter((file) => /\.[jt]sx?$/.test(file));
};

const normalizePath = (value) => value.split('?')[0]
  .replace(/^\/api/, '')
  .replace(/\$\{[^}]+\}/g, '{}')
  .replace(/\{[^}]+\}/g, '{}');

const files = await listFiles(sourceRoot);
const calls = [];
const callPattern = /api\.(get|post|put|patch|delete)\(\s*([`'"])(.*?)\2/gs;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(callPattern)) {
    calls.push({ method: match[1], path: match[3], file: path.relative(process.cwd(), file) });
  }
}

const response = await fetch(swaggerUrl);
if (!response.ok) throw new Error(`Swagger returned HTTP ${response.status}`);
const swagger = await response.json();
const operations = new Set();
for (const [swaggerPath, methods] of Object.entries(swagger.paths || {})) {
  for (const method of Object.keys(methods)) operations.add(`${method.toLowerCase()} ${normalizePath(swaggerPath)}`);
}

const missing = calls.filter((call) => !operations.has(`${call.method} ${normalizePath(call.path)}`));
if (missing.length > 0) {
  for (const call of missing) console.error(`MISSING ${call.method.toUpperCase()} ${call.path} (${call.file})`);
  process.exitCode = 1;
} else {
  console.log(`API contract check passed: ${calls.length} literal FE calls match ${operations.size} Swagger operations.`);
}
