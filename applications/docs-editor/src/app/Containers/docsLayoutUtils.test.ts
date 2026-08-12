import {
  DOCS_EDITOR_MAX_WIDTH,
  getContextualCommentsWidth,
  getDocsLayoutColumnWidths,
  getEditorBleedArea,
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
  it('centers wide content in the full viewport when no side panels are visible', () => {
    expect(getEditorBleedArea({ left: 384, editor: 832, right: 384 }, 0, 0)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 0,
      centerOffset: -392,
    })
  })

  it('moves the editor bleed area to the inline end of a visible TOC', () => {
    expect(getEditorBleedArea({ left: 384, editor: 832, right: 384 }, 300, 0)).toEqual({
      inlineStartInset: 300,
      inlineEndInset: 0,
      centerOffset: -242,
    })
  })

  it('keeps the full viewport available when the inline end is unconstrained', () => {
    expect(getEditorBleedArea({ left: 68, editor: 832, right: 300 }, 0, 0)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 0,
      centerOffset: -76,
    })
  })

  it('constrains wide content when an inline-end width is provided', () => {
    expect(getEditorBleedArea({ left: 68, editor: 832, right: 300 }, 0, 300)).toEqual({
      inlineStartInset: 0,
      inlineEndInset: 300,
      centerOffset: -226,
    })
  })

  it('uses the shrunken TOC width when both panels are constrained', () => {
    expect(getEditorBleedArea({ left: 200, editor: 800, right: 200 }, 300, 0)).toEqual({
      inlineStartInset: 200,
      inlineEndInset: 0,
      centerOffset: -108,
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
