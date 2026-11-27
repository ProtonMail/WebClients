import { downloadExport } from './ExportAndDownload'

describe('downloadExport', () => {
  let saved: string[]

  beforeEach(() => {
    saved = []
    URL.createObjectURL = vi.fn(() => 'blob:https://docs.proton.dev/1')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download)
    })
  })

  afterEach(() => vi.restoreAllMocks())

  test('saves as <name>.<format>', () => {
    downloadExport(new Uint8Array([1]), 'Meeting notes', 'docx')

    expect(saved).toEqual(['Meeting notes.docx'])
  })

  test('saves under a name made safe for file systems, as the document name may hold any character', () => {
    downloadExport(new Uint8Array([1]), '../../Budget/2027', 'xlsx')

    expect(saved).toEqual(['_.._Budget_2027.xlsx'])
  })
})

// The same cases as the client's copy of its file name rule, `applications/docs/src/app/utils/safeFileName.test.ts`
describe('downloadExport file names', () => {
  let saved: string[]

  beforeEach(() => {
    saved = []
    URL.createObjectURL = vi.fn(() => 'blob:https://docs.proton.dev/1')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download)
    })
  })

  afterEach(() => vi.restoreAllMocks())

  function fileNameFor(name: string): string {
    downloadExport(new Uint8Array([1]), name, 'docx')
    return saved[saved.length - 1]
  }

  test.each([
    ['Budget 2027 (v2) – final', 'Budget 2027 (v2) – final.docx'],
    ['Compte rendu été \u{1f31e}', 'Compte rendu été \u{1f31e}.docx'],
    ['../../../tmp/x', '_.._.._tmp_x.docx'],
    ['..\\..\\Windows\\x', '_.._Windows_x.docx'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a_b_c_d_e_f_g_h_i_j.docx'],
    ['line\nbreak\u0000nul\u2028end', 'line_break_nul_end.docx'],
    ['invoice\u202excod\u061c\u200b', 'invoice_xcod__.docx'],
    ['a\ud83cb', 'a_b.docx'],
    ['.hidden', 'hidden.docx'],
    ['  Notes. . ', 'Notes.docx'],
    ['..', 'Untitled.docx'],
    ['', 'Untitled.docx'],
    ['CON', '_CON.docx'],
    ['CONOUT$', '_CONOUT$.docx'],
    [`con${' '.repeat(260)}x`, '_con.docx'],
  ])('%j becomes %j', (name, expected) => {
    expect(fileNameFor(name)).toBe(expected)
  })

  test('shortens the name to fit in 255 bytes with its extension, between characters as people see them', () => {
    expect(fileNameFor('a'.repeat(300))).toBe(`${'a'.repeat(249)}.docx`)
    expect(fileNameFor('\u{1f31e}'.repeat(100))).toBe(`${'\u{1f31e}'.repeat(62)}.docx`)
    const family = '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}'
    expect(fileNameFor(family.repeat(20))).toBe(`${family.repeat(9)}.docx`)
  })
})
