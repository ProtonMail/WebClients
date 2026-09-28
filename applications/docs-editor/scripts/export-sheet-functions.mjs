#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(packageRoot, '../..')
const require = createRequire(import.meta.url)
const { functionDescriptions } = require(
  path.join(repoRoot, 'vendor/rowsncolumns/functions/dist/cjs/function-descriptions.js'),
)
const { default: FormulaParser } = require(
  path.join(repoRoot, 'vendor/rowsncolumns/fast-formula-parser/dist/cjs/index.js'),
)
const { default: visibility } = await import('../src/app/Containers/Spreadsheet/function-visibility.json', {
  with: { type: 'json' },
})

const implementedNames = FormulaParser.getImplementedFunctionNames()
const descriptions = functionDescriptions
  .filter(
    (fn) =>
      implementedNames.has(fn.title) &&
      !visibility.excludedDatatypes.includes(fn.datatype.toLowerCase()) &&
      !visibility.excludedNames.includes(fn.title.toLowerCase()),
  )
  .sort((a, b) => a.title.localeCompare(b.title))

const columns = ['name', 'category', 'syntax', 'description', 'example', 'usage', 'parameters']
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
const rows = descriptions.map((fn) => [
  fn.title,
  fn.datatype,
  fn.syntax,
  fn.description,
  fn.example,
  (fn.usage ?? []).join('\n'),
  fn.parameters.map(({ title, description }) => `${title}: ${description}`).join('\n'),
])
const csv = [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'

const output = process.argv[2]
if (output) {
  const outputPath = path.resolve(process.env.PROJECT_CWD ?? process.cwd(), output)
  await writeFile(outputPath, csv)
  console.error(`exported ${descriptions.length} sheets functions to ${outputPath}`)
} else {
  process.stdout.write(csv)
}
