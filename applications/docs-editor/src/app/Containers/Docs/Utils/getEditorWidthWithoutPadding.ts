export function getElementDimensionsWithoutPadding(element: HTMLElement | null):
  | {
      width: number
      height: number
    }
  | undefined {
  if (!element) {
    return undefined
  }

  const editorRootElementStyle = getComputedStyle(element)
  const editorRootElementRect = element.getBoundingClientRect()

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
