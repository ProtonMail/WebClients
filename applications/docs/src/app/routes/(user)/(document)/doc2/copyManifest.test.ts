import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

type ManifestEntry = {
  doc2: string
  doc2Symbol?: string
  kind: string
  source: string
  sourceSymbol?: string
  sourceCommit: string
  copiedIn: string
  notes: string
}

const FORM_OF_KIND: Record<string, string> = { copy: 'Copied from', adaptation: 'Adapted from', mirror: 'Mirrors' }
const FULL_SHA = /^[0-9a-f]{40}$/
// The source path may start the comment's next line, and ends before a backtick, a space or trailing punctuation
const SOURCE_COMMENT = /\b(Copied from|Adapted from|Mirrors)\s+(?:(?:\*|\/\/)\s+)?`?([^\s`]*[^\s`.,:;)])/g
const RETIRED_WORDING = /\b(?:Ported from|Pattern copied from)\b/gi

function sourceCommentsIn(text: string): { form: string; source: string }[] {
  return [...text.matchAll(SOURCE_COMMENT)].map(([, form, source]) => ({ form, source }))
}

/**
 * Where the manifest and doc2's files disagree, given the text of each non-test doc2 file by its path. Never reads a
 * source: another team deleting one must not fail doc2's tests.
 */
function findManifestProblems(entries: ManifestEntry[], files: Map<string, string>): string[] {
  const problems: string[] = []
  for (const [doc2, text] of files) {
    for (const { form, source } of sourceCommentsIn(text)) {
      if (!entries.some((e) => e.doc2 === doc2 && e.source === source && FORM_OF_KIND[e.kind] === form)) {
        problems.push(`${doc2} says "${form} ${source}" with no manifest entry of that kind`)
      }
    }
    for (const [wording] of text.matchAll(RETIRED_WORDING)) {
      problems.push(`${doc2} says "${wording}": write Copied from, Adapted from or Mirrors`)
    }
  }
  for (const entry of entries) {
    const text = files.get(entry.doc2)
    const form = FORM_OF_KIND[entry.kind]
    if (!form) {
      problems.push(`${entry.doc2}: kind ${entry.kind} is not one of ${Object.keys(FORM_OF_KIND).join(', ')}`)
    }
    if (text === undefined) {
      problems.push(`${entry.doc2} is not a non-test doc2 file`)
    } else if (form) {
      // One comment per entry, so a piece removed with its comment can't leave its entry behind on a sibling's comment
      const comments = sourceCommentsIn(text).filter((c) => c.form === form && c.source === entry.source).length
      const siblings = entries.filter(
        (e) => e.doc2 === entry.doc2 && e.kind === entry.kind && e.source === entry.source,
      )
      if (comments < siblings.length && siblings[0] === entry) {
        problems.push(`${entry.doc2} has ${comments} "${form} ${entry.source}" comments for ${siblings.length} entries`)
      }
    }
    for (const sha of [entry.sourceCommit, entry.copiedIn]) {
      if (!FULL_SHA.test(sha)) {
        problems.push(`${entry.doc2}: ${sha} is not a full sha`)
      }
    }
  }
  return problems
}

function readDoc2Files(): Map<string, string> {
  const paths = readdirSync(__dirname, { recursive: true, encoding: 'utf8' }).filter(
    (path) => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path),
  )
  // nosemgrep: path-join-resolve-traversal -- path comes only from readdirSync(__dirname), this test's own folder
  return new Map(paths.map((path) => [path.split('\\').join('/'), readFileSync(join(__dirname, path), 'utf8')]))
}

describe('copy-manifest.json', () => {
  it('agrees with the source comments in doc2', () => {
    const entries: ManifestEntry[] = JSON.parse(readFileSync(join(__dirname, 'copy-manifest.json'), 'utf8'))

    expect(findManifestProblems(entries, readDoc2Files())).toEqual([])
  })
})

describe('findManifestProblems', () => {
  const sha = 'b40af496a3403a74e064bbb73ad6b8af7116ae32'
  const entry: ManifestEntry = {
    doc2: '__utils/getNodeName.ts',
    kind: 'copy',
    source: 'packages/docs-core/lib/DriveSDK/getNodeName.ts',
    sourceCommit: sha,
    copiedIn: sha,
    notes: 'Verbatim',
  }
  const file = (text: string) => new Map([['__utils/getNodeName.ts', text]])
  const commented = file('// Copied from `packages/docs-core/lib/DriveSDK/getNodeName.ts`, which doc2 must not import.')

  it('accepts a commented piece with its entry, in the form its kind takes', () => {
    expect(findManifestProblems([entry], commented)).toEqual([])
    expect(
      findManifestProblems(
        [{ ...entry, kind: 'adaptation' }],
        file('/** Adapted from packages/docs-core/lib/DriveSDK/getNodeName.ts. */'),
      ),
    ).toEqual([])
    expect(
      findManifestProblems(
        [{ ...entry, kind: 'mirror' }],
        file('// Mirrors packages/docs-core/lib/DriveSDK/getNodeName.ts: 50'),
      ),
    ).toEqual([])
  })

  it('accepts a source path wrapped to the next line of the comment', () => {
    expect(
      findManifestProblems(
        [entry],
        file('/**\n * Copied from\n * `packages/docs-core/lib/DriveSDK/getNodeName.ts`.\n */'),
      ),
    ).toEqual([])
    expect(
      findManifestProblems([entry], file('// Copied from\n// packages/docs-core/lib/DriveSDK/getNodeName.ts')),
    ).toEqual([])
  })

  it('fails a source comment with no entry', () => {
    expect(findManifestProblems([], commented)).toEqual([
      '__utils/getNodeName.ts says "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" with no manifest entry of that kind',
    ])
  })

  it('fails a source comment whose source is not a path from the web/clients root', () => {
    expect(findManifestProblems([entry], file('// Copied from docs-core `DriveSDK/getNodeName.ts`'))).toEqual([
      '__utils/getNodeName.ts says "Copied from docs-core" with no manifest entry of that kind',
      '__utils/getNodeName.ts has 0 "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" comments for 1 entries',
    ])
  })

  it('fails an entry whose doc2 file is gone', () => {
    expect(findManifestProblems([entry], new Map())).toEqual(['__utils/getNodeName.ts is not a non-test doc2 file'])
  })

  it('fails an entry whose doc2 file no longer names its source', () => {
    expect(findManifestProblems([entry], file('// Written for doc2'))).toEqual([
      '__utils/getNodeName.ts has 0 "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" comments for 1 entries',
    ])
  })

  it('fails a comment whose form is not its entry kind', () => {
    expect(findManifestProblems([{ ...entry, kind: 'mirror' }], commented)).toEqual([
      '__utils/getNodeName.ts says "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" with no manifest entry of that kind',
      '__utils/getNodeName.ts has 0 "Mirrors packages/docs-core/lib/DriveSDK/getNodeName.ts" comments for 1 entries',
    ])
  })

  it('fails a copy of a source with no entry when the file already adapts that source', () => {
    const adaptedAndCopied = file(
      '/** Adapted from packages/docs-core/lib/DriveSDK/getNodeName.ts */\n// Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts',
    )

    expect(findManifestProblems([{ ...entry, kind: 'adaptation' }], adaptedAndCopied)).toEqual([
      '__utils/getNodeName.ts says "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" with no manifest entry of that kind',
    ])
  })

  it('fails two entries for one file and source that share a single comment', () => {
    expect(findManifestProblems([entry, { ...entry, doc2Symbol: 'other' }], commented)).toEqual([
      '__utils/getNodeName.ts has 1 "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" comments for 2 entries',
    ])
  })

  it('fails the retired source wordings', () => {
    expect(
      findManifestProblems([], file("// Ported from docs-core\n * Pattern copied from Drive's fetchJson")),
    ).toEqual([
      '__utils/getNodeName.ts says "Ported from": write Copied from, Adapted from or Mirrors',
      '__utils/getNodeName.ts says "Pattern copied from": write Copied from, Adapted from or Mirrors',
    ])
  })

  it('fails an unknown kind and a sha that is not 40 hex characters', () => {
    expect(findManifestProblems([{ ...entry, kind: 'port', sourceCommit: 'b40af496a34' }], commented)).toEqual([
      '__utils/getNodeName.ts says "Copied from packages/docs-core/lib/DriveSDK/getNodeName.ts" with no manifest entry of that kind',
      '__utils/getNodeName.ts: kind port is not one of copy, adaptation, mirror',
      '__utils/getNodeName.ts: b40af496a34 is not a full sha',
    ])
  })

  it('never needs the source to exist', () => {
    const deletedSource = 'applications/docs/src/app/deleted.ts'

    expect(
      findManifestProblems([{ ...entry, source: deletedSource }], file(`// Copied from ${deletedSource}`)),
    ).toEqual([])
  })
})
