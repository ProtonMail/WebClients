import { uint8ArrayToUtf8String } from '@proton/crypto/lib/utils'
import type { ExporterRequiredCallbacks } from './EditorExporter'
import { EditorTxtExporter } from './EditorTxtExporter'

describe('EditorTxtExporter', () => {
  it('should export plaintext from editor', async () => {
    const stringifiedEditorState = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello world.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`

    const exporter = new EditorTxtExporter(stringifiedEditorState, {} as ExporterRequiredCallbacks)

    const plaintext = await exporter.export()

    expect(uint8ArrayToUtf8String(plaintext)).toBe('Hello world.')
  })
})
