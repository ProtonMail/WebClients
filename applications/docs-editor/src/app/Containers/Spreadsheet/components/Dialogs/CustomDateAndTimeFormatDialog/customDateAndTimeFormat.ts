import type { SheetsMessages } from '../../../messages/SheetsMessages'

import { ssfFormat } from '@rowsncolumns/utils'

import type { ExpandType } from '../../utils'

type TokenVariant = {
  code: string
  label: string
}

type TokenDef = {
  type: string
  label: string
  variants: TokenVariant[]
}

type TokenCategoryDef = {
  type: string
  label: string
  tokenDefs: TokenDef[]
}

// Invariant codes and message keys; parsing must not import the English fallback.
const TOKENS_BY_CATEGORY = [
  {
    type: 'date',
    label: 'Date',
    tokenDefs: [
      {
        type: 'day',
        label: 'Day',
        variants: [
          { code: 'd', label: 'Day without leading zero' },
          { code: 'dd', label: 'Day with leading zero' },
          { code: 'ddd', label: 'Day as abbreviation' },
          { code: 'dddd', label: 'Day as full name' },
        ],
      },
      {
        type: 'month',
        label: 'Month',
        variants: [
          { code: 'm', label: 'Month without leading zero' },
          { code: 'mm', label: 'Month with leading zero' },
          { code: 'mmm', label: 'Month as abbreviation' },
          { code: 'mmmm', label: 'Month as full name' },
          { code: 'mmmmm', label: 'First letter of the month' },
        ],
      },
      {
        type: 'year',
        label: 'Year',
        variants: [
          { code: 'yy', label: 'Two digit year' },
          { code: 'yyyy', label: 'Full numeric year' },
        ],
      },
    ],
  },
  {
    type: 'time',
    label: 'Time',
    tokenDefs: [
      {
        type: 'hour',
        label: 'Hour',
        variants: [
          { code: 'h', label: 'Hour without leading zero' },
          { code: 'hh', label: 'Hour with leading zero' },
        ],
      },
      {
        type: 'minute',
        label: 'Minute',
        variants: [
          { code: 'm', label: 'Minute without leading zero' },
          { code: 'mm', label: 'Minute with leading zero' },
        ],
      },
      {
        type: 'second',
        label: 'Second',
        variants: [
          { code: 's', label: 'Second without leading zero' },
          { code: 'ss', label: 'Second with leading zero' },
        ],
      },
      {
        type: 'millisecond',
        label: 'Millisecond',
        variants: [
          { code: '.0', label: 'Precision to 1/10 of a second' },
          { code: '.00', label: 'Precision to 1/100 of a second' },
          { code: '.000', label: 'Precision to 1/1000 of a second' },
        ],
      },
      {
        type: 'ampm',
        label: 'AM/PM',
        // TODO: re-add the shortened AM/PM variants once @rowsncolumns/utils renders them correctly.
        // Currently `a/p` isn't recognized (renders literally + stays 24-hour) and `A/P` renders the
        // full "PM" instead of "P", so only `AM/PM` produces correct output.
        variants: [{ code: 'AM/PM', label: 'Full' }],
      },
    ],
  },
  {
    type: 'duration',
    label: 'Duration',
    tokenDefs: [
      {
        type: 'elapsed-hour',
        label: 'Elapsed hours',
        variants: [
          { code: '[h]', label: 'Elapsed hours without leading zero' },
          { code: '[hh]', label: 'Elapsed hours with leading zero' },
        ],
      },
      {
        type: 'elapsed-minute',
        label: 'Elapsed minutes',
        variants: [
          { code: '[m]', label: 'Elapsed minutes without leading zero' },
          { code: '[mm]', label: 'Elapsed minutes with leading zero' },
        ],
      },
      {
        type: 'elapsed-second',
        label: 'Elapsed seconds',
        variants: [
          { code: '[s]', label: 'Elapsed seconds without leading zero' },
          { code: '[ss]', label: 'Elapsed seconds with leading zero' },
        ],
      },
    ],
  },
] as const satisfies TokenCategoryDef[]

export function getTokensByCategory(messages: SheetsMessages) {
  const labels = messages.customDateAndTimeFormat
  return TOKENS_BY_CATEGORY.map((category) => ({
    ...category,
    label: labels[category.label],
    tokenDefs: category.tokenDefs.map((def) => ({
      ...def,
      label: labels[def.label],
      variants: def.variants.map((variant) => ({ ...variant, label: labels[variant.label] })),
    })),
  }))
}

export type TokenPointer = ExpandType<
  (typeof TOKENS_BY_CATEGORY)[number]['tokenDefs'][number] extends infer Def
    ? Def extends { type: infer T; variants: readonly { code: infer C }[] }
      ? { type: T; code: C }
      : never
    : never
>

type MenuColumnDef = ({
  type: string
  label: string
  variants: TokenVariant[]
} | null)[]

function buildMenuColumns(tokenCategories: TokenCategoryDef[]) {
  const ROW_COUNT = Math.max(...tokenCategories.map((c) => c.tokenDefs.length))
  const columns: MenuColumnDef[] = []
  for (let i = 0; i < ROW_COUNT; i++) {
    const row: MenuColumnDef = []
    for (const category of tokenCategories) {
      const def = category.tokenDefs[i]
      row.push(def ?? null)
    }
    columns.push(row)
  }

  return columns
}

export function getMenuColumns(messages: SheetsMessages) {
  return buildMenuColumns(getTokensByCategory(messages))
}

// Maps each SSF code to the token type(s) that use it. Only `m`/`mm` are ambiguous (month vs minute).
const CODE_TO_TYPES = new Map<string, string[]>()
for (const category of TOKENS_BY_CATEGORY) {
  for (const tokenDef of category.tokenDefs) {
    for (const variant of tokenDef.variants) {
      const types = CODE_TO_TYPES.get(variant.code) ?? []
      types.push(tokenDef.type)
      CODE_TO_TYPES.set(variant.code, types)
    }
  }
}

// Only `AM/PM` is supported (see the AM/PM token's TODO). Add `A/P`/`a/p` here if they're reinstated.
const AMPM_CODES = ['AM/PM']
const RUN_LETTERS = new Set(['d', 'm', 'y', 'h', 's'])
const HOUR_CODES = new Set(['h', 'hh', '[h]', '[hh]'])
const SECOND_CODES = new Set(['s', 'ss', '[s]', '[ss]'])

type RawSegment = { kind: 'token'; code: string } | { kind: 'literal'; text: string }
export type ParsedSegment = { kind: 'token'; pointer: TokenPointer } | { kind: 'literal'; text: string }

// Splits an SSF pattern into a flat list of token codes and literal text runs.
function tokenizePattern(pattern: string): RawSegment[] {
  const segments: RawSegment[] = []
  let literal = ''

  const flushLiteral = () => {
    if (literal) {
      segments.push({ kind: 'literal', text: literal })
      literal = ''
    }
  }

  const pushToken = (code: string) => {
    flushLiteral()
    segments.push({ kind: 'token', code })
  }

  let i = 0
  while (i < pattern.length) {
    const char = pattern[i]

    // Quoted literal — the content between quotes is verbatim text.
    if (char === '"') {
      const end = pattern.indexOf('"', i + 1)
      if (end === -1) {
        literal += pattern.slice(i + 1)
        i = pattern.length
      } else {
        literal += pattern.slice(i + 1, end)
        i = end + 1
      }
      continue
    }

    // Backslash escapes the next character as a literal.
    if (char === '\\' && i + 1 < pattern.length) {
      literal += pattern[i + 1]
      i += 2
      continue
    }

    // Elapsed (duration) codes are bracketed, e.g. [h], [mm].
    if (char === '[') {
      const end = pattern.indexOf(']', i + 1)
      const code = end === -1 ? '' : pattern.slice(i, end + 1)
      if (code && CODE_TO_TYPES.has(code)) {
        pushToken(code)
        i = end + 1
        continue
      }
      literal += char
      i += 1
      continue
    }

    // AM/PM markers. Listed longest-first so a longer marker wins over a shorter prefix of it.
    const start = i
    const ampm = AMPM_CODES.find((candidate) => pattern.startsWith(candidate, start))
    if (ampm) {
      pushToken(ampm)
      i += ampm.length
      continue
    }

    // Milliseconds: a dot followed by one or more zeros.
    if (char === '.' && pattern[i + 1] === '0') {
      let j = i + 1
      while (pattern[j] === '0') {
        j += 1
      }
      const code = pattern.slice(i, j)
      if (CODE_TO_TYPES.has(code)) {
        pushToken(code)
        i = j
        continue
      }
      literal += char
      i += 1
      continue
    }

    // Letter runs (case-insensitive): a run of the same letter is one code, e.g. dddd, mm.
    const lower = char.toLowerCase()
    if (RUN_LETTERS.has(lower)) {
      let j = i
      while (j < pattern.length && pattern[j].toLowerCase() === lower) {
        j += 1
      }
      const code = lower.repeat(j - i)
      if (CODE_TO_TYPES.has(code)) {
        pushToken(code)
        i = j
        continue
      }
      literal += pattern.slice(i, j)
      i = j
      continue
    }

    literal += char
    i += 1
  }

  flushLiteral()
  return segments
}

// Resolves an SSF code to a concrete token type, disambiguating month vs minute by neighboring tokens.
function resolveTokenType(code: string, prevCode: string | undefined, nextCode: string | undefined): string {
  const types = CODE_TO_TYPES.get(code) ?? []
  if (types.length === 1) {
    return types[0]
  }
  const isMinute = (prevCode && HOUR_CODES.has(prevCode)) || (nextCode && SECOND_CODES.has(nextCode))
  return isMinute ? 'minute' : 'month'
}

export function parsePattern(pattern: string): ParsedSegment[] {
  const segments = tokenizePattern(pattern)
  const tokenCodes = segments.flatMap((segment) => (segment.kind === 'token' ? [segment.code] : []))

  let tokenIndex = 0
  return segments.map((segment) => {
    if (segment.kind === 'literal') {
      return segment
    }
    const type = resolveTokenType(segment.code, tokenCodes[tokenIndex - 1], tokenCodes[tokenIndex + 1])
    tokenIndex += 1
    return { kind: 'token', pointer: { type, code: segment.code } as TokenPointer }
  })
}

const TIME_TOKEN_TYPES = new Set([
  'hour',
  'minute',
  'second',
  'millisecond',
  'ampm',
  'elapsed-hour',
  'elapsed-minute',
  'elapsed-second',
])

// Classifies a pattern as DATE_TIME when it contains any time/duration token, otherwise DATE.
export function inferDateFormatType(pattern: string): 'DATE' | 'DATE_TIME' {
  const hasTimeToken = parsePattern(pattern).some(
    (segment) => segment.kind === 'token' && TIME_TOKEN_TYPES.has(segment.pointer.type),
  )
  return hasTimeToken ? 'DATE_TIME' : 'DATE'
}

// Whether the pattern contains at least one date/time token (not just literal text).
export function hasToken(pattern: string): boolean {
  return parsePattern(pattern).some((segment) => segment.kind === 'token')
}

// Strips SSF directives the token editor can't represent, so a cell's stored pattern can seed the editor:
// a leading locale/currency tag (e.g. `[$-en-us]`) and a trailing text section (e.g. `;@`). The editor is
// locale-agnostic, so dropping the tag lets the cell render in the sheet's locale.
export function stripUnsupportedDirectives(pattern: string): string {
  return pattern.replace(/^\[\$[^\]]*\]/, '').replace(/;@$/, '')
}

// Characters that are never interpreted as a token code, so they can appear in a literal unquoted.
const SAFE_LITERAL_CHAR = /[0-9\s/\-:,.()]/

// Serializes literal text back into an SSF pattern, quoting (or escaping) anything that would otherwise parse as a token.
export function serializeLiteral(text: string): string {
  if (text === '') {
    return ''
  }
  if ([...text].every((char) => SAFE_LITERAL_CHAR.test(char))) {
    return text
  }
  if (!text.includes('"')) {
    return `"${text}"`
  }
  return [...text].map((char) => `\\${char}`).join('')
}

// Sample used to render a token's live example. Single-digit units (day 5, hour 1, minute 1, second 1, month 8)
// so leading-zero variants are visually distinct, with a PM time to illustrate the AM/PM token.
const EXAMPLE_DATE = new Date(1930, 7, 5, 13, 1, 1)

// Renders a localized example of a single token against EXAMPLE_DATE, e.g. day `dddd` → "Tuesday".
// Minute, hour, millisecond, and elapsed tokens can't be rendered in isolation by ssfFormat
// (minute `mm` reads as month, elapsed renders absolute serials, etc.), so they're handled directly.
export function getTokenExample(tokenPointer: TokenPointer, localeResolved: string): string {
  switch (tokenPointer.type) {
    case 'hour':
      return tokenPointer.code === 'hh' ? '01' : '1'
    case 'minute':
      return tokenPointer.code === 'mm' ? '01' : '1'
    case 'millisecond':
      return { '.0': '1', '.00': '01', '.000': '001' }[tokenPointer.code]
    case 'elapsed-hour':
    case 'elapsed-minute':
    case 'elapsed-second':
      return tokenPointer.code.length === 4 ? '01' : '1'
    default:
      return ssfFormat(tokenPointer.code, EXAMPLE_DATE, localeResolved)
  }
}

export const customDateAndTimeFormatMessages = {
  customDateAndTimeFormat: {
    Delete: `Delete`,
    Date: `Date`,
    Time: `Time`,
    Duration: `Duration`,
    Day: `Day`,
    Month: `Month`,
    Year: `Year`,
    Hour: `Hour`,
    Minute: `Minute`,
    Second: `Second`,
    Millisecond: `Millisecond`,
    'AM/PM': `AM/PM`,
    'Elapsed hours': `Elapsed hours`,
    'Elapsed minutes': `Elapsed minutes`,
    'Elapsed seconds': `Elapsed seconds`,
    'Day without leading zero': `Day without leading zero`,
    'Day with leading zero': `Day with leading zero`,
    'Day as abbreviation': `Day as abbreviation`,
    'Day as full name': `Day as full name`,
    'Month without leading zero': `Month without leading zero`,
    'Month with leading zero': `Month with leading zero`,
    'Month as abbreviation': `Month as abbreviation`,
    'Month as full name': `Month as full name`,
    'First letter of the month': `First letter of the month`,
    'Two digit year': `Two digit year`,
    'Full numeric year': `Full numeric year`,
    'Hour without leading zero': `Hour without leading zero`,
    'Hour with leading zero': `Hour with leading zero`,
    'Minute without leading zero': `Minute without leading zero`,
    'Minute with leading zero': `Minute with leading zero`,
    'Second without leading zero': `Second without leading zero`,
    'Second with leading zero': `Second with leading zero`,
    'Precision to 1/10 of a second': `Precision to 1/10 of a second`,
    'Precision to 1/100 of a second': `Precision to 1/100 of a second`,
    'Precision to 1/1000 of a second': `Precision to 1/1000 of a second`,
    Full: `Full`,
    'Elapsed hours without leading zero': `Elapsed hours without leading zero`,
    'Elapsed hours with leading zero': `Elapsed hours with leading zero`,
    'Elapsed minutes without leading zero': `Elapsed minutes without leading zero`,
    'Elapsed minutes with leading zero': `Elapsed minutes with leading zero`,
    'Elapsed seconds without leading zero': `Elapsed seconds without leading zero`,
    'Elapsed seconds with leading zero': `Elapsed seconds with leading zero`,
  },
}
