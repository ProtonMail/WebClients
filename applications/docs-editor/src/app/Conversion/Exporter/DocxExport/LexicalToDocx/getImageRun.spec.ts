import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../../../../AllNodes'
import { getImageRun } from './getImageRun'
import { $getRoot, ParagraphNode } from 'lexical'
import { ImageNode } from '../../../../Plugins/Image/ImageNode'
import { toImage } from '@proton/shared/lib/helpers/image'
import { ImageRun } from 'docx'

jest.mock('@proton/shared/lib/helpers/image', () => ({
  toImage: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
}))

jest.mock('docx', () => ({
  ...jest.requireActual('docx'),
  ImageRun: jest.fn(),
}))

describe('getImageRun', () => {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: console.error,
  })

  const fetchExternalImageAsBase64 = jest.fn()

  it('should fetch image if not base64', async () => {
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        paragraphNode.append(new ImageNode('https://example.com/image.png', '', null))
        paragraphNode.append(new ImageNode('data:image/png;base64,base64', '', null))
        $getRoot().append(paragraphNode)
      },
      {
        discrete: true,
      },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())

    const externalImageNode = state.read(() => paragraphNode.getFirstChildOrThrow<ImageNode>())
    fetchExternalImageAsBase64.mockResolvedValueOnce('base64')
    const externalImageRun = await getImageRun(externalImageNode, fetchExternalImageAsBase64)
    expect(externalImageRun).not.toBeNull()
    expect(fetchExternalImageAsBase64).toHaveBeenCalledWith('https://example.com/image.png')
    fetchExternalImageAsBase64.mockClear()
    expect(ImageRun).toHaveBeenCalledWith({
      data: 'base64',
      transformation: {
        width: 100,
        height: 100,
      },
    })

    const base64ImageNode = state.read(() => paragraphNode.getLastChildOrThrow<ImageNode>())
    const base64ImageRun = await getImageRun(base64ImageNode, fetchExternalImageAsBase64)
    expect(base64ImageRun).not.toBeNull()
    expect(fetchExternalImageAsBase64).not.toHaveBeenCalled()
    expect(ImageRun).toHaveBeenCalledWith({
      data: 'data:image/png;base64,base64',
      transformation: {
        width: 100,
        height: 100,
      },
    })
  })

  it('should not get image dimensions if explicitly set', async () => {
    ;(toImage as unknown as jest.Mock).mockClear()
    editor.update(
      () => {
        $getRoot().clear()
        const paragraphNode = new ParagraphNode()
        paragraphNode.append(new ImageNode('data:image/png;base64,base64', '', null, 250, 250))
        $getRoot().append(paragraphNode)
      },
      {
        discrete: true,
      },
    )
    const state = editor.getEditorState()
    const paragraphNode = state.read(() => $getRoot().getFirstChildOrThrow<ParagraphNode>())
    const imageNode = state.read(() => paragraphNode.getFirstChildOrThrow<ImageNode>())
    const imageRun = await getImageRun(imageNode, fetchExternalImageAsBase64)
    expect(imageRun).not.toBeNull()
    expect(toImage).not.toHaveBeenCalled()
    expect(ImageRun).toHaveBeenCalledWith({
      data: 'data:image/png;base64,base64',
      transformation: {
        width: 250,
        height: 250,
      },
    })
  })
})
