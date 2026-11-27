import { getSafeFileName } from './safeFileName'

describe('getSafeFileName', () => {
  test('keeps an ordinary name, in any script, with its extension', () => {
    expect(getSafeFileName('Meeting notes', 'docx')).toBe('Meeting notes.docx')
    expect(getSafeFileName('Budget 2027 (v2) – final', 'xlsx')).toBe('Budget 2027 (v2) – final.xlsx')
    expect(getSafeFileName('Compte rendu été 🌞', 'md')).toBe('Compte rendu été 🌞.md')
    expect(getSafeFileName('v1.2 notes', 'txt')).toBe('v1.2 notes.txt')
  })

  test.each([
    ['../../../tmp/x', '_.._.._tmp_x.docx'],
    ['..\\..\\Windows\\x', '_.._Windows_x.docx'],
    ['/etc/passwd', '_etc_passwd.docx'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a_b_c_d_e_f_g_h_i_j.docx'],
  ])('replaces path separators and characters Windows forbids: %s', (name, expected) => {
    expect(getSafeFileName(name, 'docx')).toBe(expected)
  })

  test('replaces control characters, line separators, and the invisible and bidirectional controls that disguise a name', () => {
    expect(getSafeFileName('line\nbreak\ttab\u0000nul\u007fdel\u2028end', 'txt')).toBe('line_break_tab_nul_del_end.txt')
    expect(getSafeFileName('invoice\u202excod', 'html')).toBe('invoice_xcod.html')
    expect(getSafeFileName('a\u2066b\u2069c\u200fd\u061ce\u200bf\ufeffg', 'csv')).toBe('a_b_c_d_e_f_g.csv')
  })

  test('replaces half of a surrogate pair, which is no character', () => {
    expect(getSafeFileName('a\ud83cb', 'md')).toBe('a_b.md')
  })

  test('removes leading and trailing dots and spaces, so no name is hidden, relative or ends oddly', () => {
    expect(getSafeFileName('.hidden', 'md')).toBe('hidden.md')
    expect(getSafeFileName('  Notes. . ', 'md')).toBe('Notes.md')
  })

  test.each(['', '   ', '.', '..', '...', ' . . '])('uses "Untitled" when nothing is left of %j', (name) => {
    expect(getSafeFileName(name, 'odt')).toBe('Untitled.odt')
  })

  test('prefixes the names Windows reserves for devices', () => {
    expect(getSafeFileName('CON', 'txt')).toBe('_CON.txt')
    expect(getSafeFileName('nul.tar', 'txt')).toBe('_nul.tar.txt')
    expect(getSafeFileName('com1', 'txt')).toBe('_com1.txt')
    expect(getSafeFileName('LPT\u00b2', 'txt')).toBe('_LPT\u00b2.txt')
    expect(getSafeFileName('CONOUT$', 'txt')).toBe('_CONOUT$.txt')
    expect(getSafeFileName('Console', 'txt')).toBe('Console.txt')
  })

  test('prefixes a device name that only shortening leaves', () => {
    expect(getSafeFileName(`con${' '.repeat(260)}x`, 'docx')).toBe('_con.docx')
  })

  test('shortens the name to fit in 255 bytes with its extension', () => {
    // 249 bytes for the name: 255, less ".docx" and room for a device name's "_"
    expect(getSafeFileName('a'.repeat(300), 'docx')).toBe(`${'a'.repeat(249)}.docx`)
    // 4 bytes each: 62 of them make 248 bytes
    const emojis = getSafeFileName('\u{1f31e}'.repeat(100), 'docx')
    expect(emojis).toBe(`${'\u{1f31e}'.repeat(62)}.docx`)
    expect(new TextEncoder().encode(emojis).length).toBeLessThanOrEqual(255)
  })

  test('cuts between characters as people see them, never inside an emoji', () => {
    // A family: 4 people joined by 3 zero-width joiners, 25 bytes
    const family = '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}'
    expect(getSafeFileName(family.repeat(20), 'docx')).toBe(`${family.repeat(9)}.docx`)
  })

  test('does not end the shortened name with a dot or a space', () => {
    expect(getSafeFileName(`${'a'.repeat(248)} .b`, 'docx')).toBe(`${'a'.repeat(248)}.docx`)
  })
})
