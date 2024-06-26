import { LexicalEditor } from 'lexical'

export function getEditorDimensionsWithoutPadding(editor: LexicalEditor) {
  const editorRootElement = editor.getRootElement()

  if (!editorRootElement) {
    return undefined
  }

  const editorRootElementStyle = getComputedStyle(editorRootElement)
  const editorRootElementRect = editorRootElement.getBoundingClientRect()

  const horizontalPadding =
    parseFloat(editorRootElementStyle.paddingLeft) + parseFloat(editorRootElementStyle.paddingRight)
  const verticalPadding =
    parseFloat(editorRootElementStyle.paddingTop) + parseFloat(editorRootElementStyle.paddingBottom)

  const width = editorRootElementRect.width - horizontalPadding
  const height = editorRootElementRect.height - verticalPadding

  return {
    width,
    height,
  }
}
