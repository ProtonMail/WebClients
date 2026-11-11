import { exportAndDownload } from './downloadExport'

describe('exportAndDownload', () => {
  let saved: { name: string; blob: Blob }[]

  beforeEach(() => {
    saved = []
    const blobs = new Map<string, Blob>()
    URL.createObjectURL = jest.fn((blob: Blob) => {
      const url = `blob:https://docs.proton.dev/${blobs.size}`
      blobs.set(url, blob)
      return url
    })
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push({ name: this.download, blob: blobs.get(this.href)! })
    })
  })

  afterEach(() => jest.restoreAllMocks())

  test('saves what the editor exports as <name>.docx, with the Word type', async () => {
    const docx = new Uint8Array([80, 75, 3, 4])
    const editorInvoker = { exportData: jest.fn().mockResolvedValue(docx) }

    await exportAndDownload(editorInvoker, 'Meeting notes', 'docx')

    expect(editorInvoker.exportData).toHaveBeenCalledWith('docx')
    expect(saved).toHaveLength(1)
    expect(saved[0].name).toBe('Meeting notes.docx')
    expect(saved[0].blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(await readBytes(saved[0].blob)).toEqual(docx)
  })

  test.each([
    ['odt', 'application/vnd.oasis.opendocument.text'],
    ['html', 'text/html'],
    ['txt', 'text/plain'],
    ['md', 'text/markdown'],
  ] as const)('saves a %s export as <name>.%s, with type %s', async (format, type) => {
    const editorInvoker = { exportData: jest.fn().mockResolvedValue(new TextEncoder().encode('Hello')) }

    await exportAndDownload(editorInvoker, 'Notes', format)

    expect(saved).toEqual([{ name: `Notes.${format}`, blob: expect.any(Blob) }])
    expect(saved[0].blob.type).toBe(type)
  })

  test('saves nothing when the export fails', async () => {
    const editorInvoker = { exportData: jest.fn().mockRejectedValue(new Error('Editor did not answer exportData')) }

    await expect(exportAndDownload(editorInvoker, 'Notes', 'docx')).rejects.toThrow('Editor did not answer exportData')
    expect(saved).toEqual([])
  })

  test('leaves no link in the page', async () => {
    const editorInvoker = { exportData: jest.fn().mockResolvedValue(new Uint8Array([1])) }

    await exportAndDownload(editorInvoker, 'Notes', 'txt')

    expect(document.querySelector('a[download]')).toBeNull()
  })
})

// jsdom's Blob has no arrayBuffer()
function readBytes(blob: Blob): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.readAsArrayBuffer(blob)
  })
}
