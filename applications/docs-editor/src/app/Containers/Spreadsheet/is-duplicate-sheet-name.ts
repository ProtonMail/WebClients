interface Sheet {
  id: number
  name: string
}

export function isDuplicateSheetName(sheetId: number, name: string, sheets: Sheet[]): boolean {
  const normalizedName = name.toLocaleLowerCase()
  return sheets.some((sheet) => sheet.id !== sheetId && sheet.name.toLocaleLowerCase() === normalizedName)
}

export function getUniqueSheetName(sheetId: number, name: string, sheets: Sheet[]): string | undefined {
  const baseName = name.trim()
  if (!baseName) {
    return undefined
  }

  let candidate = baseName
  let suffix = 2
  while (isDuplicateSheetName(sheetId, candidate, sheets)) {
    candidate = `${baseName} (${suffix})`
    suffix += 1
  }
  return candidate
}
