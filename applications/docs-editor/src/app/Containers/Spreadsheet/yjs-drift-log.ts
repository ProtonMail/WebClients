type SpreadsheetYjsDriftLogDifference = {
  key: string
  reason?: string
  localValue: unknown
  yjsValue: unknown
}

type SpreadsheetYjsDriftLogOptions = {
  differences: SpreadsheetYjsDriftLogDifference[]
  patches: unknown
  localChangedKeys?: readonly string[]
  observedYjsKeys?: readonly string[]
}

const MAX_STRING_LENGTH = 300
const MAX_ARRAY_ITEMS = 5
const MAX_OBJECT_KEYS = 8
const MAX_DEPTH = 3

export function formatSpreadsheetYjsDriftLogDetails({
  differences,
  patches,
  localChangedKeys,
  observedYjsKeys,
}: SpreadsheetYjsDriftLogOptions): Record<string, unknown> {
  return {
    differenceCount: differences.length,
    differenceKeys: differences.map(({ key }) => key),
    differences: differences.map(({ key, reason, localValue, yjsValue }) => ({
      key,
      reason,
      localValue: summarizeForDriftLog(localValue),
      yjsValue: summarizeForDriftLog(yjsValue),
    })),
    localChangedKeys,
    observedYjsKeys,
    patches: summarizeForDriftLog(patches),
  }
}

function summarizeForDriftLog(value: unknown, depth = 0): unknown {
  if (value === undefined) {
    return { type: 'undefined' }
  }
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value instanceof Map) {
    return summarizeRecord(Object.fromEntries(value.entries()), depth)
  }
  if (value instanceof Set) {
    return summarizeArray(Array.from(value), depth)
  }
  if (Array.isArray(value)) {
    return summarizeArray(value, depth)
  }
  if (isRecord(value)) {
    return summarizeRecord(value, depth)
  }
  return String(value)
}

function summarizeArray(values: unknown[], depth: number): unknown {
  if (depth >= MAX_DEPTH) {
    return { type: 'array', length: values.length }
  }
  return {
    type: 'array',
    length: values.length,
    sample: values.slice(0, MAX_ARRAY_ITEMS).map((item) => summarizeForDriftLog(item, depth + 1)),
  }
}

function summarizeRecord(value: Record<string, unknown>, depth: number): unknown {
  const keys = Object.keys(value).sort()
  if (depth >= MAX_DEPTH) {
    return { type: 'object', keyCount: keys.length, keys: keys.slice(0, MAX_OBJECT_KEYS) }
  }

  const sample: Record<string, unknown> = {}
  for (const key of keys.slice(0, MAX_OBJECT_KEYS)) {
    sample[key] = summarizeForDriftLog(value[key], depth + 1)
  }

  return {
    type: 'object',
    keyCount: keys.length,
    keys: keys.slice(0, MAX_OBJECT_KEYS),
    sample,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
