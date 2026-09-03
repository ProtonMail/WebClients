import { $getRoot, $nodesOfType, createEditor, type SerializedEditorState } from 'lexical'
import { odtToHtml } from 'odf-kit/odt/to-html'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import { AllNodes } from '../../../AllNodes'
import { ImageNode } from '../../../Plugins/Image/ImageNode'
import { $importDataIntoEditor } from '../../ImportDataIntoEditor'
import type { ExporterRequiredCallbacks } from '../EditorExporter'
import { EditorOdtExporter, restorePageBreaks } from './EditorOdtExporter'

jest.mock('../../../Utils/errorMessage', () => ({ reportErrorToSentry: jest.fn() }))

const onePixelPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

const editorState = {
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 1, mode: 'normal', style: '', text: 'Before image', type: 'text', version: 1 },
          {
            altText: 'pixel',
            caption: {
              editorState: {
                root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 },
              },
            },
            height: 48,
            maxWidth: null,
            showCaption: false,
            src: 'blob:proton-image',
            type: 'image',
            version: 1,
            width: 96,
          },
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'After image', type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      { type: 'pagebreak', version: 1 },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'New page', type: 'text', version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

describe('EditorOdtExporter', () => {
  it('exports and imports formatted text and externally stored images', async () => {
    const callbacks: ExporterRequiredCallbacks = {
      fetchExternalImageAsBase64: jest.fn().mockResolvedValue(onePixelPng),
    }
    const exporter = new EditorOdtExporter(editorState as SerializedEditorState, callbacks)

    const result = await exporter.export()
    const html = odtToHtml(result, { fragment: true })

    expect(callbacks.fetchExternalImageAsBase64).toHaveBeenCalledWith('blob:proton-image')
    expect(html).toContain('<strong>Before image</strong>')
    expect(html).toContain('data:image/png;base64,')
    expect(html).toContain('width:2.54cm')
    expect(html).toContain('height:1.27cm')
    expect(html).toContain('After image')
    const contentXml = strFromU8(unzipSync(result)['content.xml'])
    expect(contentXml).toContain('style:name="ProtonPageBreak"')
    expect(contentXml).toContain('fo:break-before="page"')
    expect(contentXml).toContain('<text:p text:style-name="ProtonPageBreak"/>')

    const editor = createEditor({
      editable: false,
      namespace: 'odt-import-test',
      nodes: AllNodes,
      onError: (error) => {
        throw error
      },
    })
    const rootElement = document.createElement('div')
    document.body.append(rootElement)
    editor.setRootElement(rootElement)
    const importResult = await $importDataIntoEditor(editor, result, { docType: 'doc', dataType: 'odt' })

    expect(importResult.isFailed()).toBe(false)
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toContain('Before image')
      expect($getRoot().getTextContent()).toContain('After image')
      expect($getRoot().getAllTextNodes()[0].hasFormat('bold')).toBe(true)
      const [image] = $nodesOfType(ImageNode)
      expect(image.getWidth()).toBe(96)
      expect(image.getHeight()).toBe(48)
    })
  })

  it('exports the document without an image when fetching it fails', async () => {
    const fetchError = new Error('Failed to fetch image')
    const callbacks: ExporterRequiredCallbacks = {
      fetchExternalImageAsBase64: jest.fn().mockRejectedValue(fetchError),
    }
    const exporter = new EditorOdtExporter(editorState as SerializedEditorState, callbacks)

    const result = await exporter.export()
    const html = odtToHtml(result, { fragment: true })

    expect(html).toContain('Before image')
    expect(html).toContain('After image')
    expect(html).not.toContain('<img')
    expect(reportErrorToSentry).toHaveBeenCalledWith(fetchError)
  })

  it('restores page-break markers across markup changes without aborting export', () => {
    const firstMarker = '\uE000proton-odt-page-break-0\uE001'
    const secondMarker = '\uE000proton-odt-page-break-1\uE001'
    const missingMarker = '\uE000proton-odt-page-break-2\uE001'
    const input = new Uint8Array(
      zipSync({
        mimetype: strToU8('application/vnd.oasis.opendocument.text'),
        'content.xml': strToU8(
          '<office:document-content><office:automatic-styles></office:automatic-styles>' +
            `<office:body><text:p><text:span>${firstMarker.slice(0, 12)}</text:span>` +
            `<text:span>${firstMarker.slice(12)}</text:span></text:p>` +
            `<text:p><text:span>${secondMarker}</text:span></text:p></office:body></office:document-content>`,
        ),
      }),
    )

    const output = restorePageBreaks(input, [firstMarker, secondMarker, missingMarker])
    const contentXml = strFromU8(unzipSync(output)['content.xml'])

    expect(contentXml.match(/<text:p text:style-name="ProtonPageBreak"\/>/g)).toHaveLength(2)
    expect(contentXml).toContain('fo:break-before="page"')
    expect(contentXml).not.toContain(firstMarker)
    expect(contentXml).not.toContain(secondMarker)
    expect(reportErrorToSentry).toHaveBeenCalledWith(expect.any(Error), undefined, { markerIndex: 2 })
  })
})
