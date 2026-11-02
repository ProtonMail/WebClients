import {
  clampToContentBoxX,
  DOCS_EDITOR_MAX_WIDTH,
  getContextualCommentsWidth,
  getDocsLayoutColumnWidths,
  getEditorBleedArea,
  getGutterClickCaretProbePoint,
  isDocsLayoutGutterTarget,
  isOutsideClientArea,
} from './docsLayoutUtils'

describe('getDocsLayoutColumnWidths', () => {
  it('uses a single editor column below the desktop breakpoint', () => {
    expect(getDocsLayoutColumnWidths(DOCS_EDITOR_MAX_WIDTH - 1, 300, 200)).toEqual({
      left: 0,
      editor: DOCS_EDITOR_MAX_WIDTH - 1,
      right: 0,
    })
  })

  it('keeps the editor centered when no side panels need space', () => {
    expect(getDocsLayoutColumnWidths(1600, 0, 0)).toEqual({
      left: 384,
      editor: 832,
      right: 384,
    })
  })

  it('uses the maximum editor width once the viewport has enough space', () => {
    expect(getDocsLayoutColumnWidths(900, 0, 0)).toEqual({
      left: 34,
      editor: 832,
      right: 34,
    })
  })

  it('does not move the editor when the TOC fits in the existing gutter', () => {
    expect(getDocsLayoutColumnWidths(1600, 300, 0)).toEqual({
      left: 384,
      editor: 832,
      right: 384,
    })
  })

  it('shifts the editor only enough to fit the TOC', () => {
    expect(getDocsLayoutColumnWidths(1200, 300, 0)).toEqual({
      left: 300,
      editor: 832,
      right: 68,
    })
  })

  it('preserves the TOC while shrinking comments before the editor', () => {
    expect(getDocsLayoutColumnWidths(1400, 300, 300)).toEqual({
      left: 300,
      editor: 832,
      right: 268,
    })
  })

  it('shrinks the editor after comments reach their minimum width', () => {
    expect(getDocsLayoutColumnWidths(1200, 300, 300)).toEqual({
      left: 300,
      editor: 700,
      right: 200,
    })
  })

  it('preserves the TOC width in a constrained viewport', () => {
    expect(getDocsLayoutColumnWidths(900, 300, 0)).toEqual({
      left: 300,
      editor: 600,
      right: 0,
    })
  })
})

describe('getEditorBleedArea', () => {
  it('leaves both sides unconstrained when no side panels are visible', () => {
    expect(getEditorBleedArea({ left: 384, editor: 832, right: 384 }, 0, 0)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 0,
    })
  })

  it('reserves space for a visible TOC', () => {
    expect(getEditorBleedArea({ left: 384, editor: 832, right: 384 }, 300, 0)).toEqual({
      inlineStartInset: 300,
      inlineEndInset: 0,
    })
  })

  it('keeps the full viewport available when the inline end is unconstrained', () => {
    expect(getEditorBleedArea({ left: 68, editor: 832, right: 300 }, 0, 0)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 0,
    })
  })

  it('constrains wide content when an inline-end width is provided', () => {
    expect(getEditorBleedArea({ left: 68, editor: 832, right: 300 }, 0, 300)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 300,
    })
  })

  it('uses the shrunken TOC width when both panels are constrained', () => {
    expect(getEditorBleedArea({ left: 200, editor: 800, right: 200 }, 300, 0)).toEqual({
      inlineStartInset: 200,
      inlineEndInset: 0,
    })
  })
})

describe('getContextualCommentsWidth', () => {
  it('uses popovers below the desktop breakpoint', () => {
    expect(getContextualCommentsWidth(DOCS_EDITOR_MAX_WIDTH - 1)).toBeNull()
  })

  it('claims the responsive comments width on desktop', () => {
    expect(getContextualCommentsWidth(DOCS_EDITOR_MAX_WIDTH)).toBe(200)
    expect(getContextualCommentsWidth(1600)).toBe(328)
  })
})

describe('isDocsLayoutGutterTarget', () => {
  function elementWithClass(className: string) {
    const element = document.createElement('div')
    element.className = className
    return element
  }

  it('accepts the layout grid and the center panel', () => {
    expect(isDocsLayoutGutterTarget(elementWithClass('docs-layout-grid'))).toBe(true)
    expect(isDocsLayoutGutterTarget(elementWithClass('docs-layout-center-panel'))).toBe(true)
  })

  it('rejects editor content, panels and non-elements', () => {
    expect(isDocsLayoutGutterTarget(elementWithClass('DocumentEditor'))).toBe(false)
    expect(isDocsLayoutGutterTarget(elementWithClass('docs-layout-left-panel'))).toBe(false)
    expect(isDocsLayoutGutterTarget(document.createTextNode('text'))).toBe(false)
    expect(isDocsLayoutGutterTarget(null)).toBe(false)
  })
})

describe('getGutterClickCaretProbePoint', () => {
  const editorRect = { left: 400, right: 1200, top: 50, bottom: 900 }

  it('pulls a left gutter click to the start of the editor at the same height', () => {
    expect(getGutterClickCaretProbePoint({ x: 100, y: 300 }, editorRect)).toEqual({ x: 401, y: 300 })
  })

  it('pulls a right gutter click to the end of the editor at the same height', () => {
    expect(getGutterClickCaretProbePoint({ x: 1500, y: 300 }, editorRect)).toEqual({ x: 1199, y: 300 })
  })

  it('keeps the point inside the editor vertically', () => {
    expect(getGutterClickCaretProbePoint({ x: 100, y: 10 }, editorRect)).toEqual({ x: 401, y: 51 })
    expect(getGutterClickCaretProbePoint({ x: 100, y: 990 }, editorRect)).toEqual({ x: 401, y: 899 })
  })
})

describe('isOutsideClientArea', () => {
  const element = { clientWidth: 1425, clientHeight: 800 }

  it('is false inside the client area', () => {
    expect(isOutsideClientArea({ offsetX: 100, offsetY: 300 }, element)).toBe(false)
    expect(isOutsideClientArea({ offsetX: 1424, offsetY: 799 }, element)).toBe(false)
  })

  it('is true on a right or bottom scrollbar', () => {
    expect(isOutsideClientArea({ offsetX: 1430, offsetY: 300 }, element)).toBe(true)
    expect(isOutsideClientArea({ offsetX: 100, offsetY: 805 }, element)).toBe(true)
  })

  it('is true on a left scrollbar (RTL)', () => {
    expect(isOutsideClientArea({ offsetX: -5, offsetY: 300 }, element)).toBe(true)
  })
})

describe('clampToContentBoxX', () => {
  const rect = { left: 400, right: 1200 }
  const style = { borderLeftWidth: '4px', paddingLeft: '15px', borderRightWidth: '0px', paddingRight: '10px' }

  it('moves a point on the left padding or border just inside the content box', () => {
    expect(clampToContentBoxX(401, rect, style)).toBe(420)
  })

  it('moves a point on the right padding just inside the content box', () => {
    expect(clampToContentBoxX(1199, rect, style)).toBe(1189)
  })

  it('leaves a point inside the content box alone', () => {
    expect(clampToContentBoxX(800, rect, style)).toBe(800)
  })

  it('leaves the point alone when the content box is too narrow', () => {
    expect(clampToContentBoxX(401, { left: 400, right: 420 }, style)).toBe(401)
  })
})
