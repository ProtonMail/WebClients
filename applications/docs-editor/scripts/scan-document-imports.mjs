#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const defaultRoot = path.resolve(packageRoot, 'src/app/Containers/Docs')

const args = process.argv.slice(2)
const failOnFound = args.includes('--fail-on-found')
const json = args.includes('--json')
const rootArgIndex = args.indexOf('--root')
const scanRoot = rootArgIndex === -1 ? defaultRoot : path.resolve(process.cwd(), args[rootArgIndex + 1] ?? defaultRoot)
const defaultConsumersRoot = path.resolve(packageRoot, 'src')
const consumersArgIndex = args.indexOf('--consumers')
const consumersRoot =
  consumersArgIndex === -1
    ? defaultConsumersRoot
    : path.resolve(process.cwd(), args[consumersArgIndex + 1] ?? defaultConsumersRoot)
const publicEntry = path.join(scanRoot, 'public')
const testingEntry = path.join(scanRoot, 'testing')
const testFilePattern = /\.(test|spec)\.tsx?$/

const importPatterns = [
  /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /export\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /(?:\brequire|\bjest\.(?:mock|doMock|unmock|dontMock|setMock|requireActual|requireMock|createMockFromModule))\s*(?:<[^;]*?>)?\s*\(\s*['"]([^'"]+)['"]/g,
]

const styleImportPatterns = [
  /@(?:use|import|forward)\s+['"]([^'"]+)['"]/g,
  /@import\s+url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g,
]

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const styleExtensions = new Set(['.scss', '.css'])

const hostImportMatchers = [
  {
    label: 'proton package',
    // `~` is how Sass loads a package through webpack.
    matches: (specifier) => /^~?@proton\//.test(specifier),
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
    label: 'outside document',
    matches: (specifier, resolvedPath) =>
      specifier.startsWith('.') && resolvedPath !== undefined && !isInside(resolvedPath, scanRoot),
  },
]

if (!existsSync(scanRoot)) {
  console.error(`document import scan failed: missing root ${scanRoot}`)
  process.exit(2)
}

const files = await collectSourceFiles(scanRoot)
const findings = []

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const patterns = styleExtensions.has(path.extname(file)) ? styleImportPatterns : importPatterns
  for (const importRecord of extractImports(source, patterns)) {
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

const consumerFiles = existsSync(consumersRoot)
  ? (await collectSourceFiles(consumersRoot)).filter(
      (file) => !isInside(file, scanRoot) && sourceExtensions.has(path.extname(file)),
    )
  : []

for (const file of consumerFiles) {
  const source = await readFile(file, 'utf8')
  for (const importRecord of extractImports(source, importPatterns)) {
    const resolvedPath = resolveImportPath(file, importRecord.specifier)
    if (resolvedPath === undefined || !isInside(resolvedPath, scanRoot)) {
      continue
    }
    const entry = resolvedPath.replace(/\.[cm]?[jt]sx?$/, '')
    if (entry === publicEntry || (entry === testingEntry && testFilePattern.test(file))) {
      continue
    }

    findings.push({
      file: path.relative(packageRoot, file),
      line: lineNumberAt(source, importRecord.index),
      specifier: importRecord.specifier,
      labels: [entry === testingEntry ? 'Docs test entry' : 'Docs internals'],
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

    const extension = path.extname(entry.name)
    if (entry.isFile() && (sourceExtensions.has(extension) || styleExtensions.has(extension))) {
      files.push(fullPath)
    }
  }

  return files
}

function extractImports(source, patterns) {
  return patterns.flatMap((pattern) => {
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
  console.log('document proton/client import scan')
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
