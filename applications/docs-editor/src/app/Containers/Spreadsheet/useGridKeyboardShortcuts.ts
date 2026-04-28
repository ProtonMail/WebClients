import { useEffect, useRef } from 'react'
import { useUI } from './ui-store'

/** Minimal shape of the CellInterface from @rowsncolumns/grid (1-based row/column indices). */
type CellInterface = { rowIndex: number; columnIndex: number }

/**
 * Implements Excel / Google Sheets keyboard shortcut parity for the spreadsheet grid.
 *
 * The underlying CanvasGrid (from @rowsncolumns/spreadsheet) handles many shortcuts
 * internally, but several common navigation and selection shortcuts are absent or
 * behave incorrectly. This hook intercepts those specific key combinations in the
 * capture phase so our handlers run before the library's bubble-phase listeners.
 *
 * Shortcuts implemented here
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Selection extending (anchor stays at active cell; selection grows toward cursor):
 *   Shift + Home       → Extend selection to column A of the current row
 *   Ctrl + Shift+Home  → Extend selection all the way to A1
 *   Shift + End        → Extend selection to the last column of the current row
 *
 * Full row / column / sheet selection:
 *   Shift + Space      → Select the entire row of the active cell
 *   Ctrl  + Space      → Select the entire column of the active cell
 *   Ctrl  + Shift+Space→ Select all cells (move anchor to A1)
 *
 * Not yet implemented
 * ─────────────────────────────────────────────────────────────────────────────
 *   Ctrl+End / Ctrl+Shift+End — require knowing the extent of actual data
 *     (last row/column with content), not just the allocated sheet dimensions
 *     (rowCount/columnCount). Needs the getDataRowCount signature from the
 *     vendor package before these can be implemented correctly.
 *
 *   Home / Ctrl+Home (navigation without Shift) — the library likely already
 *     handles these. Overriding them in the capture phase without confirming
 *     they are broken risks replacing library-provided scroll animation and
 *     visual feedback. Verify against the vendor package first.
 */
export function useGridKeyboardShortcuts(): void {
  // ── Reactive state ───────────────────────────────────────────────────────────
  //
  // We subscribe to the minimum set of reactive values we need.  Each value is
  // immediately mirrored into `stateRef` so that the single document keydown
  // listener (created once inside useEffect) can always read the *current* values
  // without capturing stale closures.

  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const activeSheetId = useUI((ui) => ui.legacy.activeSheetId)
  // rowCount / columnCount can be negative as a sentinel; normalise here.
  const rowCount = Math.abs(useUI((ui) => ui.legacy.rowCount))
  const columnCount = Math.abs(useUI((ui) => ui.legacy.columnCount))

  const stateRef = useRef({ activeCell, activeSheetId, rowCount, columnCount })
  stateRef.current = { activeCell, activeSheetId, rowCount, columnCount }

  // `useUI.$` returns the current UI state typed as FunctionsOnly<…> – i.e. only
  // the callable members survive.  We mirror it into a ref and refresh it on every
  // render so the event handler always dispatches to the latest versions.
  const setters = useUI.$
  const settersRef = useRef(setters)
  settersRef.current = setters

  // ── Single lifecycle effect ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // ── Guard: grid must be in the focus tree ──────────────────────────────
      // `getGridContainerElement` lives on `legacy` in the full ProtonSheetsState;
      // we cast to `any` because FunctionsOnly strips non-function-valued leaves
      // and the exact shape of `grid` is private to the vendor package.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacySetters = settersRef.current.legacy as any
      const container: HTMLElement | null = legacySetters?.getGridContainerElement?.() ?? null
      if (!container) return
      if (!container.contains(document.activeElement)) return

      // ── Guard: skip while a cell is being edited ───────────────────────────
      // The library renders an overlay <input> or contenteditable element when
      // the user is typing into a cell.  We must not steal those key events.
      const focusedEl = document.activeElement as HTMLElement | null
      if (!focusedEl) return
      if (
        focusedEl instanceof HTMLInputElement ||
        focusedEl instanceof HTMLTextAreaElement ||
        focusedEl.isContentEditable
      ) {
        return
      }

      // ── Modifier flags ─────────────────────────────────────────────────────
      const ctrl = e.ctrlKey || e.metaKey // treat ⌘ (Mac) as Ctrl throughout
      const shift = e.shiftKey
      const alt = e.altKey
      // Leave Alt/Option combinations entirely to the browser / OS.
      if (alt) return

      // ── Current position ───────────────────────────────────────────────────
      const { activeCell, activeSheetId, rowCount, columnCount } = stateRef.current
      const { rowIndex, columnIndex } = activeCell

      // ── Helpers ────────────────────────────────────────────────────────────

      /**
       * Update the selection range without moving the active-cell anchor.
       *
       * Coordinates are 1-based and automatically clamped to sheet bounds.
       * The range is normalised so that start ≤ end regardless of the order
       * the arguments are passed (mirrors how Shift-selection works in Excel).
       */
      const extendSelection = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number,
      ): void => {
        const r1 = Math.max(1, Math.min(startRow, endRow))
        const c1 = Math.max(1, Math.min(startCol, endCol))
        const r2 = Math.min(rowCount, Math.max(startRow, endRow))
        const c2 = Math.min(columnCount, Math.max(startCol, endCol))

        legacySetters.onChangeSelections(activeSheetId, [
          {
            range: {
              startRowIndex: r1,
              startColumnIndex: c1,
              endRowIndex: r2,
              endColumnIndex: c2,
            },
          },
        ])
      }

      /**
       * Scroll a cell into view without moving the active cell or selection.
       * Used alongside extendSelection to reveal the newly selected boundary.
       */
      const scrollToVisible = (toRow: number, toCol: number): void => {
        const cell: CellInterface = {
          rowIndex: Math.max(1, Math.min(toRow, rowCount)),
          columnIndex: Math.max(1, Math.min(toCol, columnCount)),
        }
        legacySetters.grid?.scrollToCell?.(cell)
      }

      // ══════════════════════════════════════════════════════════════════════════
      // Shortcut dispatch
      // Each branch calls e.preventDefault() + e.stopPropagation() to prevent the
      // library's bubble-phase handler from double-processing the same keystroke.
      // Branches are evaluated in specificity order (more-modifier first) so that
      // e.g. Ctrl+Shift+Home is tested before Shift+Home.
      // ══════════════════════════════════════════════════════════════════════════

      // ── Ctrl + Shift + Home (most specific) ───────────────────────────────
      if (ctrl && shift && e.key === 'Home') {
        // Extend selection from the active cell all the way to A1.
        e.preventDefault()
        e.stopPropagation()
        extendSelection(1, 1, rowIndex, columnIndex)
        scrollToVisible(1, 1)
        return
      }

      // ── Ctrl + Shift + Space: select all ─────────────────────────────────
      if (ctrl && shift && e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        // Move the anchor to A1 so it matches Excel / Google Sheets behaviour.
        legacySetters.onChangeActiveCell(activeSheetId, { rowIndex: 1, columnIndex: 1 })
        extendSelection(1, 1, rowCount, columnCount)
        return
      }

      // ── Shift + Home ──────────────────────────────────────────────────────
      if (shift && !ctrl && e.key === 'Home') {
        // Extend selection to column A of the active row.
        e.preventDefault()
        e.stopPropagation()
        extendSelection(rowIndex, 1, rowIndex, columnIndex)
        scrollToVisible(rowIndex, 1)
        return
      }

      // ── Shift + End ───────────────────────────────────────────────────────
      if (shift && !ctrl && e.key === 'End') {
        // Extend selection to the last column of the active row.
        // Note: this intentionally selects to the last *allocated* column
        // (matching Google Sheets behaviour for Shift+End), not the last
        // column that contains data (which would require Ctrl+Shift+End).
        e.preventDefault()
        e.stopPropagation()
        extendSelection(rowIndex, columnIndex, rowIndex, columnCount)
        scrollToVisible(rowIndex, columnCount)
        return
      }

      // ── Shift + Space: select entire row ─────────────────────────────────
      if (!ctrl && shift && e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        extendSelection(rowIndex, 1, rowIndex, columnCount)
        return
      }

      // ── Ctrl + Space: select entire column ────────────────────────────────
      if (ctrl && !shift && e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        extendSelection(1, columnIndex, rowCount, columnIndex)
        return
      }
    }

    // Attach in the capture phase so our handler fires before the library's
    // bubble-phase listeners.  stopPropagation() is called only for the shortcuts
    // we explicitly handle, so every other keystroke passes through unchanged.
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [])
  // ↑ Intentionally empty dependency array: all mutable values are read through
  //   refs (stateRef / settersRef) which are refreshed on every render above.
}
