#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const defaultRoot = path.resolve(packageRoot, 'src/app/Containers/Spreadsheet')

const args = process.argv.slice(2)
const failOnFound = args.includes('--fail-on-found')
const json = args.includes('--json')
const rootArgIndex = args.indexOf('--root')
const scanRoot = rootArgIndex === -1 ? defaultRoot : path.resolve(process.cwd(), args[rootArgIndex + 1] ?? defaultRoot)

const importPatterns = [
  /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /export\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

const hostImportMatchers = [
  {
    label: 'proton package',
    matches: (specifier) => specifier.startsWith('@proton/'),
  },
  {
    label: 'proton i18n',
    matches: (specifier) => specifier === 'ttag',
  },
  {
    label: 'client alias',
    matches: (specifier) => /^(applications|packages|docs\/src|Utils|Components|Hooks|app)\//.test(specifier),
  },
  {
    label: 'app provider',
    matches: (specifier, resolvedPath) =>
      /(^|\/)(ApplicationProvider|EditorStateProvider)(\.[cm]?[jt]sx?)?$/.test(specifier) ||
      /\/(ApplicationProvider|EditorStateProvider)(\.[cm]?[jt]sx?)?$/.test(resolvedPath ?? ''),
  },
  {
    label: 'outside spreadsheet',
    matches: (specifier, resolvedPath) =>
      specifier.startsWith('.') && resolvedPath !== undefined && !isInside(resolvedPath, scanRoot),
  },
]

if (!existsSync(scanRoot)) {
  console.error(`spreadsheet import scan failed: missing root ${scanRoot}`)
  process.exit(2)
}

const files = await collectSourceFiles(scanRoot)
const findings = []

for (const file of files) {
  const source = await readFile(file, 'utf8')
  for (const importRecord of extractImports(source)) {
    const resolvedPath = resolveImportPath(file, importRecord.specifier)
    const labels = hostImportMatchers
      .filter((matcher) => matcher.matches(importRecord.specifier, resolvedPath))
      .map((matcher) => matcher.label)

    if (labels.length === 0) {
      continue
    }

    findings.push({
      file: path.relative(packageRoot, file),
      line: lineNumberAt(source, importRecord.index),
      specifier: importRecord.specifier,
      labels,
    })
  }
}

findings.sort(
  (left, right) =>
    left.file.localeCompare(right.file) || left.line - right.line || left.specifier.localeCompare(right.specifier),
)

if (json) {
  console.log(JSON.stringify({ root: path.relative(packageRoot, scanRoot), count: findings.length, findings }, null, 2))
} else {
  printTextReport(findings)
}

if (failOnFound && findings.length > 0) {
  process.exit(1)
}

async function collectSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)))
      continue
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function extractImports(source) {
  return importPatterns.flatMap((pattern) => {
    const matches = []
    let match

    while ((match = pattern.exec(source)) !== null) {
      matches.push({ specifier: match[1], index: match.index })
    }

    pattern.lastIndex = 0
    return matches
  })
}

function resolveImportPath(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    return undefined
  }

  return path.resolve(path.dirname(fromFile), specifier)
}

function isInside(candidatePath, parentPath) {
  const relativePath = path.relative(parentPath, candidatePath)
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length
}

function printTextReport(findings) {
  console.log('spreadsheet proton/client import scan')
  console.log(`found ${findings.length} import${findings.length === 1 ? '' : 's'}`)

  if (findings.length === 0) {
    return
  }

  let currentFile

  for (const finding of findings) {
    if (finding.file !== currentFile) {
      currentFile = finding.file
      console.log(`\n${currentFile}`)
    }

    console.log(`  ${finding.line}: ${finding.specifier} (${finding.labels.join(', ')})`)
  }
}
