/** The longest file name, in UTF-8 bytes, that common file systems (ext4, APFS, NTFS) all accept */
const MAX_FILE_NAME_BYTES = 255

/**
 * What file systems reject in a file name, or read as part of a path: path separators, characters Windows forbids,
 * control characters and line separators, and the invisible and bidirectional controls that make a name display
 * differently from what it is.
 */
// oxlint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS =
  /[/\\:*?"<>|\u0000-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u2028-\u202e\u2060\u2066-\u2069\ufeff]/g

/** Names Windows reserves for devices, with or without an extension */
const WINDOWS_RESERVED_NAME =
  /^(con|prn|aux|nul|conin\$|conout\$|com[\d\u00b9\u00b2\u00b3]|lpt[\d\u00b9\u00b2\u00b3])(\.|$)/i

/** The name when nothing of the document's name is left */
const FALLBACK_NAME = 'Untitled'

const encoder = new TextEncoder()

/**
 * A file name for a download, made from a document's name (which may hold any character) and the extension of its
 * format: what file systems reject is replaced with `_`, leading and trailing dots and spaces are removed, and the
 * name is shortened to fit with its extension in 255 bytes. docs-core's `UseCase/ExportAndDownload.ts` has a copy.
 */
export function getSafeFileName(name: string, extension: string): string {
  const suffix = `.${extension}`
  // One byte kept for the `_` a device name gets
  const maxBytes = MAX_FILE_NAME_BYTES - encoder.encode(suffix).length - 1
  const base = trimDotsAndSpaces(
    truncateToBytes(trimDotsAndSpaces(replaceLoneSurrogates(name.replace(UNSAFE_CHARACTERS, '_'))), maxBytes),
  )
  if (!base) {
    return `${FALLBACK_NAME}${suffix}`
  }
  return WINDOWS_RESERVED_NAME.test(base) ? `_${base}${suffix}` : `${base}${suffix}`
}

/** Replaces with `_` each half of a UTF-16 surrogate pair that lacks its other half, which is no character */
function replaceLoneSurrogates(text: string): string {
  let result = ''
  for (const codePoint of text) {
    const code = codePoint.charCodeAt(0)
    result += codePoint.length === 1 && code >= 0xd800 && code <= 0xdfff ? '_' : codePoint
  }
  return result
}

function trimDotsAndSpaces(name: string): string {
  return name.replace(/^[.\s]+|[.\s]+$/g, '')
}

/** The longest start of `text` that fits in `maxBytes` of UTF-8, cut between characters as people see them */
function truncateToBytes(text: string, maxBytes: number): string {
  let bytes = 0
  let end = 0
  for (const character of splitCharacters(text)) {
    bytes += encoder.encode(character).length
    if (bytes > maxBytes) {
      break
    }
    end += character.length
  }
  return text.slice(0, end)
}

/** Grapheme clusters where the browser has `Intl.Segmenter`, code points elsewhere */
function splitCharacters(text: string): Iterable<string> {
  if (typeof Intl.Segmenter !== 'function') {
    return text
  }
  return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), ({ segment }) => segment)
}
