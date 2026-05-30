/**
 * Utilities for encoding and decoding internal sheet-to-sheet hyperlinks.
 *
 * Format: `#sheet:<sheetId>`
 *
 * The sheetId (a number) is used rather than the sheet name so that links
 * remain valid after a sheet is renamed.
 */

const SHEET_LINK_PREFIX = '#sheet:'

/**
 * Creates an internal sheet link string for the given sheetId.
 */
export function createSheetLink(sheetId: number): string {
  return `${SHEET_LINK_PREFIX}${sheetId}`
}

/**
 * Parses an internal sheet link string.
 * Returns `{ sheetId }` if valid, or `null` if the string is not a sheet link.
 */
export function parseSheetLink(link: string): { sheetId: number } | null {
  if (!link.startsWith(SHEET_LINK_PREFIX)) {
    return null
  }
  const raw = link.slice(SHEET_LINK_PREFIX.length)
  const sheetId = parseInt(raw, 10)
  if (isNaN(sheetId) || String(sheetId) !== raw) {
    return null
  }
  return { sheetId }
}

/**
 * Returns `true` when the given link string is an internal sheet link.
 */
export function isSheetLink(link: string): boolean {
  return parseSheetLink(link) !== null
}
