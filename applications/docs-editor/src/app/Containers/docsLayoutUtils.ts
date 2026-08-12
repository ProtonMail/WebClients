export const DOCS_EDITOR_MAX_WIDTH = 816
export const DOCS_EDITOR_INLINE_PADDING = 8
export const DOCS_EDITOR_COLUMN_MAX_WIDTH = DOCS_EDITOR_MAX_WIDTH + DOCS_EDITOR_INLINE_PADDING * 2

export const LEFT_PANEL_DEFAULT_WIDTH = 300
export const LEFT_PANEL_MIN_WIDTH = 200
export const LEFT_PANEL_MAX_WIDTH = 480

/** Contextual panels can shrink below the `300px` minimum used by comment popovers. */
export const CONTEXTUAL_COMMENTS_MIN_WIDTH = 200
export const CONTEXTUAL_COMMENTS_VIEWPORT_WIDTH_RATIO = 0.205

export type DocsLayoutColumnWidths = {
  left: number
  editor: number
  right: number
}

export type DocsLayoutEditorBleedArea = {
  inlineStartInset: number
  inlineEndInset: number
  centerOffset: number
}

export function getDefaultLeftPanelWidth(viewportWidth: number): number {
  if (viewportWidth < DOCS_EDITOR_MAX_WIDTH) {
    return 0
  }

  return clampLeftPanelWidth(LEFT_PANEL_DEFAULT_WIDTH, viewportWidth)
}

export function clampLeftPanelWidth(width: number, viewportWidth: number): number {
  if (viewportWidth < DOCS_EDITOR_MAX_WIDTH) {
    return 0
  }

  return Math.min(Math.max(width, LEFT_PANEL_MIN_WIDTH), LEFT_PANEL_MAX_WIDTH)
}

function getRequiredSideWidths(
  availableWidth: number,
  leftPreferredWidth: number,
  rightPreferredWidth: number,
): { left: number; right: number } {
  const rightMinimumWidth = rightPreferredWidth > 0 ? Math.min(rightPreferredWidth, CONTEXTUAL_COMMENTS_MIN_WIDTH) : 0
  const availableRightWidth = availableWidth - leftPreferredWidth
  const right = Math.min(Math.max(availableRightWidth, rightMinimumWidth), rightPreferredWidth)

  return {
    left: leftPreferredWidth,
    right,
  }
}

export function getDocsLayoutColumnWidths(
  viewportWidth: number,
  leftPreferredWidth: number,
  rightPreferredWidth: number,
): DocsLayoutColumnWidths {
  if (viewportWidth < DOCS_EDITOR_MAX_WIDTH) {
    return {
      left: 0,
      editor: viewportWidth,
      right: 0,
    }
  }

  const preferredEditorWidth = Math.min(viewportWidth, DOCS_EDITOR_COLUMN_MAX_WIDTH)
  const availableSideWidth = Math.max(0, viewportWidth - preferredEditorWidth)
  const sideWidths = getRequiredSideWidths(availableSideWidth, leftPreferredWidth, rightPreferredWidth)
  const requiredSideWidth = sideWidths.left + sideWidths.right

  if (requiredSideWidth > availableSideWidth) {
    return {
      left: sideWidths.left,
      editor: Math.max(0, viewportWidth - requiredSideWidth),
      right: sideWidths.right,
    }
  }

  const left = Math.min(Math.max(availableSideWidth / 2, sideWidths.left), availableSideWidth - sideWidths.right)

  return {
    left,
    editor: preferredEditorWidth,
    right: availableSideWidth - left,
  }
}

export function getEditorBleedArea(
  columnWidths: DocsLayoutColumnWidths,
  leftPreferredWidth: number,
  rightPreferredWidth: number,
): DocsLayoutEditorBleedArea {
  const inlineStartInset = Math.min(leftPreferredWidth, columnWidths.left)
  const inlineEndInset = Math.min(rightPreferredWidth, columnWidths.right)

  return {
    inlineStartInset,
    inlineEndInset,
    centerOffset: (inlineStartInset - inlineEndInset) / 2 - columnWidths.left - DOCS_EDITOR_INLINE_PADDING,
  }
}

export function getContextualCommentsWidth(viewportWidth: number): number | null {
  if (viewportWidth < DOCS_EDITOR_MAX_WIDTH) {
    return null
  }

  return Math.max(viewportWidth * CONTEXTUAL_COMMENTS_VIEWPORT_WIDTH_RATIO, CONTEXTUAL_COMMENTS_MIN_WIDTH)
}

export function getDocsLayoutScrollContainer(rootElement: HTMLElement | null | undefined): HTMLElement | null {
  return rootElement?.closest('.docs-layout-grid') ?? null
}
