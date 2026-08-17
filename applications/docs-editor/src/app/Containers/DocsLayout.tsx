import React from 'react'
import clsx from '@proton/utils/clsx'
import {
  clampLeftPanelWidth,
  DOCS_EDITOR_MAX_WIDTH,
  getDefaultLeftPanelWidth,
  getDocsLayoutColumnWidths,
  getEditorBleedArea,
} from './docsLayoutUtils'
import { PanelResizeHandle } from './__components/PanelResizeHandle'
import './DocsLayout.scss'

export { DOCS_EDITOR_MAX_WIDTH } from './docsLayoutUtils'

type PanelVisibility = 'collapsed' | 'expanded'

type LeftPanelLayout = {
  visibility: PanelVisibility
  setVisibility: (visibility: PanelVisibility) => void
  width: number
  setWidth: (width: number) => void
  resetWidth: () => void
}

type RightPanelLayout = {
  width: number
  setWidth: (width: number) => void
  element: HTMLDivElement | null
  setElement: (element: HTMLDivElement | null) => void
}

const LeftPanelContext = React.createContext<LeftPanelLayout | null>(null)
const RightPanelContext = React.createContext<RightPanelLayout | null>(null)

export function useLeftPanelContext(): LeftPanelLayout {
  const context = React.useContext(LeftPanelContext)
  if (!context) {
    throw new Error('useLeftPanelContext must be used within DocsLayout.Grid')
  }
  return context
}

export function useRightPanelContext(): RightPanelLayout {
  const context = React.useContext(RightPanelContext)
  if (!context) {
    throw new Error('useRightPanelContext must be used within DocsLayout.Container')
  }
  return context
}

function LeftPanel({ children }: React.PropsWithChildren) {
  const leftPanel = useLeftPanelContext()
  const [isDragging, setIsDragging] = React.useState(false)
  const isExpanded = leftPanel.visibility === 'expanded'

  return (
    <div className={clsx('docs-layout-left-panel', isExpanded && 'panel-open', isDragging && 'is-dragging')}>
      {children}
      {isExpanded && leftPanel.width > 0 && (
        <PanelResizeHandle
          className="right-0"
          onResizeEnd={() => setIsDragging(false)}
          onResize={(startWidth, delta) => leftPanel.setWidth(startWidth + delta)}
          onReset={leftPanel.resetWidth}
          onResizeStart={() => setIsDragging(true)}
        />
      )}
    </div>
  )
}

function CenterPanel({ children }: React.PropsWithChildren) {
  return <div className="docs-layout-center-panel">{children}</div>
}

function RightPanel() {
  const rightPanel = useRightPanelContext()

  return <div ref={rightPanel.setElement} className="docs-layout-right-panel" />
}

interface GridProps {
  leftPanelEnabled: boolean
}

function Grid({ children, leftPanelEnabled }: React.PropsWithChildren<GridProps>) {
  const viewportWidth = useViewportWidth()
  const leftPanel = useLeftPanelLayout(viewportWidth, leftPanelEnabled)
  const rightPanel = useRightPanelContext()

  const columnWidths = getDocsLayoutColumnWidths(viewportWidth, leftPanel.width, rightPanel.width)
  // Keep the inline end unconstrained so wide content can extend beneath contextual comments.
  const editorBleedArea = getEditorBleedArea(columnWidths, leftPanel.width, 0)

  return (
    <LeftPanelContext.Provider value={leftPanel}>
      <div
        className="docs-layout-grid"
        style={{
          // Preferred panel widths. Their grid columns can be wider when space is available.
          '--docs-layout-left-panel-width': `${leftPanel.width}px`,
          '--docs-layout-right-panel-width': `${rightPanel.width}px`,
          // Final grid track widths after fitting the panels around the editor.
          '--docs-layout-left-column-width': `${columnWidths.left}px`,
          '--docs-layout-editor-column-width': `${columnWidths.editor}px`,
          '--docs-layout-right-column-width': `${columnWidths.right}px`,
          // Position and bounds for content, such as tables, that can extend beyond the editor column.
          '--docs-layout-editor-bleed-inline-start-inset': `${editorBleedArea.inlineStartInset}px`,
          '--docs-layout-editor-bleed-inline-end-inset': `${editorBleedArea.inlineEndInset}px`,
        }}
      >
        {children}
      </div>
    </LeftPanelContext.Provider>
  )
}

export function useViewportWidth() {
  const [viewportWidth, setViewportWidth] = React.useState(() => window.innerWidth)

  React.useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewportWidth
}

function useLeftPanelLayout(viewportWidth: number, enabled: boolean): LeftPanelLayout {
  const [visibility, setVisibility] = React.useState<PanelVisibility>('collapsed')
  const [userDefinedWidth, setUserDefinedWidth] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!enabled || viewportWidth < DOCS_EDITOR_MAX_WIDTH) {
      setVisibility('collapsed')
    }
  }, [enabled, viewportWidth])

  const width =
    visibility === 'collapsed'
      ? 0
      : clampLeftPanelWidth(userDefinedWidth ?? getDefaultLeftPanelWidth(viewportWidth), viewportWidth)

  const setWidth = React.useCallback((width: number) => {
    setUserDefinedWidth(clampLeftPanelWidth(width, window.innerWidth))
  }, [])

  const resetWidth = React.useCallback(() => {
    setUserDefinedWidth(null)
  }, [])

  return {
    visibility,
    setVisibility,
    width,
    setWidth,
    resetWidth,
  }
}

function RightPanelProvider({ children }: React.PropsWithChildren) {
  const [rightPanelWidth, setRightPanelWidth] = React.useState(0)
  const [rightPanelElement, setRightPanelElement] = React.useState<HTMLDivElement | null>(null)

  return (
    <RightPanelContext.Provider
      value={{
        width: rightPanelWidth,
        setWidth: setRightPanelWidth,
        element: rightPanelElement,
        setElement: setRightPanelElement,
      }}
    >
      {children}
    </RightPanelContext.Provider>
  )
}

interface ContainerProps {
  isSuggestionMode: boolean
}

function Container({ children, isSuggestionMode }: React.PropsWithChildren<ContainerProps>) {
  return (
    <RightPanelProvider>
      <div
        className={clsx(
          // Portal target for the full comments sidebar (CommentPluginContainer).
          'docs-layout-container relative grid h-full w-full bg-[white]',
          isSuggestionMode && 'suggestion-mode',
        )}
        style={{
          gridTemplateRows: 'min-content 1fr',
          gridTemplateColumns: '1fr',
        }}
      >
        {children}
      </div>
    </RightPanelProvider>
  )
}

export default {
  Container,
  Grid,
  LeftPanel,
  CenterPanel,
  RightPanel,
}
