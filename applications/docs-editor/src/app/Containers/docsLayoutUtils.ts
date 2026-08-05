export const DOCS_EDITOR_MAX_WIDTH = 816

export const LEFT_PANEL_DEFAULT_WIDTH = 300
export const LEFT_PANEL_MIN_WIDTH = 200
export const LEFT_PANEL_MAX_WIDTH = 480

/** Contextual panels can shrink below the `300px` minimum used by comment popovers. */
export const CONTEXTUAL_COMMENTS_MIN_WIDTH = 200
export const CONTEXTUAL_COMMENTS_VIEWPORT_WIDTH_RATIO = 0.205
const CONTEXTUAL_COMMENTS_GAP = 8

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

function getPreferredContextualCommentsWidth(viewportWidth: number): number {
  return Math.max(viewportWidth * CONTEXTUAL_COMMENTS_VIEWPORT_WIDTH_RATIO, CONTEXTUAL_COMMENTS_MIN_WIDTH)
}

function getRightPanelGutterWidth(viewportWidth: number, leftPanelWidth: number): number {
  const rightPanelWidth = viewportWidth - leftPanelWidth
  if (rightPanelWidth <= DOCS_EDITOR_MAX_WIDTH) {
    return 0
  }
  return (rightPanelWidth - DOCS_EDITOR_MAX_WIDTH) / 2
}

export function getContextualCommentsWidth(viewportWidth: number, leftPanelWidth: number): number | null {
  const gutterWidth = getRightPanelGutterWidth(viewportWidth, leftPanelWidth)
  if (gutterWidth < CONTEXTUAL_COMMENTS_MIN_WIDTH + CONTEXTUAL_COMMENTS_GAP) {
    return null
  }

  return Math.min(getPreferredContextualCommentsWidth(viewportWidth), gutterWidth - CONTEXTUAL_COMMENTS_GAP)
}

export function getDocsLayoutScrollContainer(rootElement: HTMLElement | null | undefined): HTMLElement | null {
  return rootElement?.closest('.docs-layout-right-panel') ?? null
}
