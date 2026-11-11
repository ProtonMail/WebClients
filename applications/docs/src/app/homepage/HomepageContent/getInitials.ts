// Copy of getInitials and rtlSanitize from packages/shared/lib/helpers/string.ts

// Replaces the LTR and RTL override characters, which can disguise text (SEC-644)
const rtlSanitize = (str: string) => str.replace(/[\u202D\u202E]/g, '_')

export function getInitials(fullName = '') {
  if (!fullName) {
    return '?'
  }

  const words = rtlSanitize(fullName)
    .replace(/\s{2,}/g, ' ') // Remove multiple spaces
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emoji characters
    .replace(/[.,/#!$@%^&*;:{}=\-_`~()]/g, '') // Remove special chars
    .trim()
    .split(' ')
    .filter(Boolean)

  if (!words.length) {
    return '?'
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}
