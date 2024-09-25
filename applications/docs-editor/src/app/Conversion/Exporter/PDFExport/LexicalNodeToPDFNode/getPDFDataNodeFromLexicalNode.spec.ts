import type { EditorState } from 'lexical'
import { $isParagraphNode, type LexicalNode, $isElementNode } from 'lexical'
import { getPDFDataNodeFromLexicalNode } from './getPDFDataNodeFromLexicalNode'
import { $isImageNode } from '../../../../Plugins/Image/ImageNode'
import type { ExporterRequiredCallbacks } from '../../EditorExporter'

jest.mock('@react-pdf/renderer', () => ({
  StyleSheet: {
    create: jest.fn().mockReturnValue({
      page: {},
      block: {},
      wrap: {},
      row: {},
      column: {},
      listMarker: {},
      collapsibleTitle: {},
      quote: {},
    }),
  },
}))

jest.mock('lexical', () => ({
  ...jest.requireActual('lexical'),
  $isParagraphNode: jest.fn(),
  $isElementNode: jest.fn(),
}))

jest.mock('../../../../Plugins/Image/ImageNode', () => ({
  $isImageNode: jest.fn(() => false),
}))

describe('getPDFDataNodeFromLexicalNode', () => {
  const callbacks = {} as ExporterRequiredCallbacks

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return Image for base image', async () => {
    const state = {
      read: () => {},
    } as unknown as EditorState

    ;($isImageNode as unknown as jest.Mock).mockReturnValueOnce(true)

    const node = {
      src: 'data:image/png;base64,',
      __src: 'data:image/png;base64,',
    } as unknown as LexicalNode

    const result = await getPDFDataNodeFromLexicalNode(node, state, callbacks)

    expect(result).toEqual({
      type: 'Image',
      src: 'data:image/png;base64,',
      style: expect.anything(),
    })
  })

  it('should return Image nested in View from image inside paragraph', async () => {
    const state = {
      read: (fn: () => unknown) => {
        return fn()
      },
    } as unknown as EditorState

    ;($isParagraphNode as unknown as jest.Mock).mockReturnValueOnce(true)
    ;($isElementNode as unknown as jest.Mock).mockReturnValueOnce(true)
    ;($isImageNode as unknown as jest.Mock).mockReturnValueOnce(false)
    ;($isImageNode as unknown as jest.Mock).mockReturnValueOnce(true)

    const children = [
      {
        src: 'data:image/png;base64,',
        __src: 'data:image/png;base64,',
        getParent: jest.fn(),
        getWidth: jest.fn(() => 500),
        getHeight: jest.fn(() => 500),
      },
    ]

    const node = {
      getParent: jest.fn(),
      getChildren: jest.fn(() => children),
      children: children,
      getTextContent: jest.fn(() => ''),
    } as unknown as LexicalNode

    const result = await getPDFDataNodeFromLexicalNode(node, state, callbacks)

    expect(result).toEqual({
      type: 'View',
      children: [
        {
          type: 'Image',
          src: 'data:image/png;base64,',
          style: expect.anything(),
        },
      ],
    })
  })
})
