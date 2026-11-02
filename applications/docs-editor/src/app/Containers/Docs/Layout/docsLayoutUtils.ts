export const DOCS_EDITOR_MAX_WIDTH = 816
const DOCS_EDITOR_INLINE_PADDING = 8
const DOCS_EDITOR_COLUMN_MAX_WIDTH = DOCS_EDITOR_MAX_WIDTH + DOCS_EDITOR_INLINE_PADDING * 2

const LEFT_PANEL_DEFAULT_WIDTH = 300
export const LEFT_PANEL_MIN_WIDTH = 200
export const LEFT_PANEL_MAX_WIDTH = 480

/** Contextual panels can shrink below the `300px` minimum used by comment popovers. */
const CONTEXTUAL_COMMENTS_MIN_WIDTH = 200
const CONTEXTUAL_COMMENTS_VIEWPORT_WIDTH_RATIO = 0.205

export type DocsLayoutColumnWidths = {
  left: number
  editor: number
  right: number
}

export type DocsLayoutEditorBleedArea = {
  inlineStartInset: number
  inlineEndInset: number
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

type Point = { x: number; y: number }
type Rect = { left: number; right: number; top: number; bottom: number }

// Keeps the caret probe strictly inside the editor box, where caret lookups always land on editor content.
const CARET_PROBE_INSET = 1

/**
 * Whether a mousedown landed on empty layout space around the editor (the margins on either side of
 * the page), rather than on the editor itself or on a panel's content (table of contents, comments).
 */
export function isDocsLayoutGutterTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return target.classList.contains('docs-layout-grid') || target.classList.contains('docs-layout-center-panel')
}

/**
 * Whether a pointer event landed outside the target's client area, i.e. on its scrollbar. Offsets are
 * relative to the padding box, so a scrollbar on the right/bottom gives offsets past the client size,
 * and one on the left (RTL) gives a negative offset.
 */
export function isOutsideClientArea(
  offset: { offsetX: number; offsetY: number },
  element: { clientWidth: number; clientHeight: number },
): boolean {
  return (
    offset.offsetX < 0 ||
    offset.offsetY < 0 ||
    offset.offsetX >= element.clientWidth ||
    offset.offsetY >= element.clientHeight
  )
}

/**
 * Maps a click in the gutter to the closest point inside the editor: same height, pulled in
 * horizontally to the editor edge on the side that was clicked.
 */
export function getGutterClickCaretProbePoint(click: Point, editorRect: Rect): Point {
  const minX = editorRect.left + CARET_PROBE_INSET
  const maxX = editorRect.right - CARET_PROBE_INSET
  const minY = editorRect.top + CARET_PROBE_INSET
  const maxY = editorRect.bottom - CARET_PROBE_INSET

  return {
    x: Math.min(Math.max(click.x, minX), maxX),
    y: Math.min(Math.max(click.y, minY), maxY),
  }
}

type HorizontalBoxStyle = Pick<
  CSSStyleDeclaration,
  'borderLeftWidth' | 'paddingLeft' | 'borderRightWidth' | 'paddingRight'
>

/**
 * Pulls `x` inside an element's content box, past its border and padding. Blocks draw things there
 * (list markers, checkboxes, quote bars, code line numbers), and probing for a caret on them can give
 * the start of the block instead of a position on the line.
 */
export function clampToContentBoxX(x: number, rect: Pick<Rect, 'left' | 'right'>, style: HorizontalBoxStyle): number {
  const minX = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) + CARET_PROBE_INSET
  const maxX = rect.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight) - CARET_PROBE_INSET
  if (!(minX <= maxX)) {
    return x
  }

  return Math.min(Math.max(x, minX), maxX)
}
