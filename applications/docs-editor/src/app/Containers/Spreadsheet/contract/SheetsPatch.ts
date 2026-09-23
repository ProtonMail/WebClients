/**
 * Patch categories emitted and consumed by the spreadsheet editor.
 *
 * The Docs host translates these readable strings to and from its numeric storage contract.
 */
const SheetsPatchCategories = ['Base', 'Delta', 'Drifted'] as const

export type SheetsPatchCategory = (typeof SheetsPatchCategories)[number]
