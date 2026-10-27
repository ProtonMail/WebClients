import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

type Finding = { file: string; specifier: string; labels: string[] }

function scan(files: Record<string, string>, ...flags: string[]) {
  const base = mkdtempSync(path.join(tmpdir(), 'scan-document-imports-'))
  const root = path.join(base, 'Docs')
  mkdirSync(root)
  for (const [name, source] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(base, name)), { recursive: true })
    writeFileSync(path.join(base, name), source)
  }
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(__dirname, 'scan-document-imports.mjs'),
        '--root',
        root,
        '--consumers',
        base,
        '--json',
        ...flags,
      ],
      { encoding: 'utf8' },
    )
    const { findings } = JSON.parse(result.stdout) as { findings: Finding[] }
    return {
      status: result.status,
      findings: findings.map(({ file, specifier, labels }) => ({ file: path.basename(file), specifier, labels })),
    }
  } finally {
    rmSync(base, { recursive: true })
  }
}

it('fails with --fail-on-found when the container imports ttag', () => {
  const { status, findings } = scan({ 'Docs/Toolbar.tsx': "import { c } from 'ttag'\n" }, '--fail-on-found')

  expect(findings).toEqual([{ file: 'Toolbar.tsx', specifier: 'ttag', labels: ['proton i18n'] }])
  expect(status).toBe(1)
})

it('fails with --fail-on-found when the container loads host modules through require or Jest', () => {
  const { status, findings } = scan(
    {
      'Docs/Toolbar.test.tsx': [
        "const noop = jest.requireActual('@proton/utils/noop')",
        "jest.mock('ttag')",
        "jest.mock('../adapters/docs/DocsAdapter', () => ({}))",
        "const { c } = require('ttag')",
        "jest.mock('./Toolbar', () => jest.requireActual('docx'))",
        "const utils = jest.requireActual<{ noop: () => void }>('@proton/utils/noop')",
      ].join('\n'),
    },
    '--fail-on-found',
  )

  expect(findings).toEqual([
    { file: 'Toolbar.test.tsx', specifier: '@proton/utils/noop', labels: ['proton package'] },
    { file: 'Toolbar.test.tsx', specifier: 'ttag', labels: ['proton i18n'] },
    { file: 'Toolbar.test.tsx', specifier: '../adapters/docs/DocsAdapter', labels: ['outside document'] },
    { file: 'Toolbar.test.tsx', specifier: 'ttag', labels: ['proton i18n'] },
    { file: 'Toolbar.test.tsx', specifier: '@proton/utils/noop', labels: ['proton package'] },
  ])
  expect(status).toBe(1)
})

it('fails with --fail-on-found when code outside the container loads its internals, and allows public.ts', () => {
  const { status, findings } = scan(
    {
      'Docs/public.ts': "export { PreviewModeEditor } from './PreviewModeEditor'\n",
      'Docs/PreviewModeEditor.tsx': 'export const PreviewModeEditor = () => null\n',
      'App.test.tsx': [
        "import { PreviewModeEditor } from './Docs/public'",
        "jest.mock('./Docs/public', () => jest.requireActual('./Docs/public.ts'))",
        "jest.mock('./Docs/PreviewModeEditor')",
        "const { PreviewModeEditor: Actual } = jest.requireActual('./Docs/PreviewModeEditor')",
        "const commands = require('./Docs/Commands')",
        "jest.mock<typeof import('./Docs/public')>('./Docs/Commands')",
      ].join('\n'),
      'adapters/docs/DocsAdapter.tsx': "import { DocsEditorTelemetry } from '../../Docs/contract/DocsEditorTelemetry'\n",
    },
    '--fail-on-found',
  )

  expect(findings).toEqual([
    { file: 'DocsAdapter.tsx', specifier: '../../Docs/contract/DocsEditorTelemetry', labels: ['Docs internals'] },
    { file: 'App.test.tsx', specifier: './Docs/PreviewModeEditor', labels: ['Docs internals'] },
    { file: 'App.test.tsx', specifier: './Docs/PreviewModeEditor', labels: ['Docs internals'] },
    { file: 'App.test.tsx', specifier: './Docs/Commands', labels: ['Docs internals'] },
    { file: 'App.test.tsx', specifier: './Docs/Commands', labels: ['Docs internals'] },
  ])
  expect(status).toBe(1)
})

it('allows testing.ts only from test files outside the container', () => {
  const { status, findings } = scan(
    {
      'Docs/testing.ts': "export { polyfill } from './TestUtils'\n",
      'App.test.tsx': "import { polyfill } from './Docs/testing'\n",
      'standalone/Editor.spec.ts': "jest.mock('../Docs/testing.ts')\n",
      'App.tsx': "import { polyfill } from './Docs/testing'\n",
    },
    '--fail-on-found',
  )

  expect(findings).toEqual([{ file: 'App.tsx', specifier: './Docs/testing', labels: ['Docs test entry'] }])
  expect(status).toBe(1)
})

it('flags Proton styles loaded from a stylesheet, and only those', () => {
  const { findings } = scan({
    'Docs/docs.scss': [
      "@use '~@proton/styles/scss/proton-docs' as *;",
      "@import '@proton/styles/scss/lib';",
      "@use 'sass:list';",
      "@use 'lists' as *;",
      "@import url('./fonts.css');",
    ].join('\n'),
  })

  expect(findings).toEqual([
    { file: 'docs.scss', specifier: '~@proton/styles/scss/proton-docs', labels: ['proton package'] },
    { file: 'docs.scss', specifier: '@proton/styles/scss/lib', labels: ['proton package'] },
  ])
})

it('fails with --fail-on-found when a stylesheet loads Proton styles through @import url()', () => {
  const { status, findings } = scan(
    {
      'Docs/docs.scss': [
        "@import url('~@proton/styles/scss/proton-docs');",
        '@import url("@proton/styles/scss/lib");',
        '@import url(@proton/styles/scss/fonts);',
      ].join('\n'),
    },
    '--fail-on-found',
  )

  expect(findings).toEqual([
    { file: 'docs.scss', specifier: '~@proton/styles/scss/proton-docs', labels: ['proton package'] },
    { file: 'docs.scss', specifier: '@proton/styles/scss/lib', labels: ['proton package'] },
    { file: 'docs.scss', specifier: '@proton/styles/scss/fonts', labels: ['proton package'] },
  ])
  expect(status).toBe(1)
})

it('flags a stylesheet that loads one from outside the container', () => {
  const { findings } = scan({ 'Docs/docs.scss': "@use '../../app' as *;\n" })

  expect(findings).toEqual([{ file: 'docs.scss', specifier: '../../app', labels: ['outside document'] }])
})
