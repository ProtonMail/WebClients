import { lexicalToOdt } from 'odf-kit/lexical/to-odt'
import type { LexicalSerializedEditorState, LexicalSerializedNode } from 'odf-kit/lexical/to-odt'
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import { EditorExporter } from '../EditorExporter'

export class EditorOdtExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const editorState = this.editor.getEditorState().toJSON() as LexicalSerializedEditorState
    const pageBreakMarkers: string[] = []
    editorState.root.children = prepareRootNodes(editorState.root.children, pageBreakMarkers)

    const bytes = await lexicalToOdt(editorState, {
      fetchImage: async (src) => {
        try {
          const dataUrl = await this.callbacks.fetchExternalImageAsBase64(src)
          if (!dataUrl) {
            return undefined
          }

          const separatorIndex = dataUrl.indexOf(',')
          const base64 = separatorIndex === -1 ? dataUrl : dataUrl.slice(separatorIndex + 1)
          return Uint8Array.fromBase64(base64)
        } catch (error) {
          reportErrorToSentry(error)
          return undefined
        }
      },
    })

    const outputBytes = new Uint8Array(bytes)
    return pageBreakMarkers.length > 0 ? restorePageBreaks(outputBytes, pageBreakMarkers) : outputBytes
  }
}

/**
 * Proton stores inserted images inside paragraphs, while odf-kit currently
 * handles image nodes at root level. Keep their document position by splitting
 * the surrounding block around each image before handing state to odf-kit.
 */
function prepareRootNodes(nodes: LexicalSerializedNode[], pageBreakMarkers: string[]): LexicalSerializedNode[] {
  return nodes.flatMap((node) => {
    if (node.type === 'pagebreak') {
      const marker = `\uE000proton-odt-page-break-${pageBreakMarkers.length}\uE001`
      pageBreakMarkers.push(marker)
      return createMarkerParagraph(marker)
    }

    normalizeImageDimensions(node)

    if (!['paragraph', 'heading', 'quote'].includes(node.type) || !Array.isArray(node.children)) {
      return node
    }

    const children = node.children as LexicalSerializedNode[]
    if (!children.some((child) => child.type === 'image')) {
      return node
    }

    const result: LexicalSerializedNode[] = []
    let inlineChildren: LexicalSerializedNode[] = []

    const appendInlineBlock = () => {
      if (inlineChildren.length > 0) {
        result.push({ ...node, children: inlineChildren })
        inlineChildren = []
      }
    }

    for (const child of children) {
      if (child.type === 'image') {
        appendInlineBlock()
        normalizeImageDimensions(child)
        result.push(child)
      } else {
        inlineChildren.push(child)
      }
    }

    appendInlineBlock()
    return result
  })
}

function createMarkerParagraph(marker: string): LexicalSerializedNode {
  return {
    children: [{ format: 0, style: '', text: marker, type: 'text', version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}

function normalizeImageDimensions(node: LexicalSerializedNode): void {
  if (node.type === 'image') {
    if (node.width === 'inherit') {
      node.width = undefined
    }
    if (node.height === 'inherit') {
      node.height = undefined
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children as LexicalSerializedNode[]) {
      normalizeImageDimensions(child)
    }
  }
}

export function restorePageBreaks(bytes: Uint8Array<ArrayBuffer>, markers: string[]): Uint8Array<ArrayBuffer> {
  const files = unzipSync(bytes)
  let contentXml = strFromU8(files['content.xml'])
  let restoredPageBreak = false

  for (const [markerIndex, marker] of markers.entries()) {
    const result = replacePageBreakMarker(contentXml, marker)
    contentXml = result.contentXml
    restoredPageBreak ||= result.foundMarker

    if (!result.foundMarker) {
      contentXml = contentXml.replaceAll(marker, '')
      reportErrorToSentry(new Error('Failed to preserve page break in ODT export'), undefined, { markerIndex })
    }
  }

  if (restoredPageBreak) {
    const pageBreakStyle =
      '<style:style style:name="ProtonPageBreak" style:family="paragraph" style:parent-style-name="Standard">' +
      '<style:paragraph-properties fo:break-before="page"/>' +
      '</style:style>'
    const contentWithPageBreakStyle = contentXml.replace(
      '</office:automatic-styles>',
      `${pageBreakStyle}</office:automatic-styles>`,
    )
    if (contentWithPageBreakStyle === contentXml) {
      reportErrorToSentry(new Error('Failed to add page break style to ODT export'))
    } else {
      contentXml = contentWithPageBreakStyle
    }
  }

  files['content.xml'] = strToU8(contentXml)

  const archive: Zippable = {
    mimetype: [files.mimetype, { level: 0 }],
  }
  for (const [path, data] of Object.entries(files)) {
    if (path !== 'mimetype') {
      archive[path] = [data, { level: 6 }]
    }
  }

  return zipSync(archive)
}

function replacePageBreakMarker(contentXml: string, marker: string): { contentXml: string; foundMarker: boolean } {
  let foundMarker = false
  const updatedContentXml = contentXml.replace(/<text:p\b(?:[^>]*[^/>])?>[\s\S]*?<\/text:p>/g, (paragraph) => {
    const textContent = paragraph.replace(/<[^>]+>/g, '').trim()
    if (textContent !== marker) {
      return paragraph
    }

    foundMarker = true
    return '<text:p text:style-name="ProtonPageBreak"/>'
  })

  return { contentXml: updatedContentXml, foundMarker }
}
