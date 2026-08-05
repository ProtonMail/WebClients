import React from 'react'
import clsx from '@proton/utils/clsx'
import { clampLeftPanelWidth, DOCS_EDITOR_MAX_WIDTH, getDefaultLeftPanelWidth } from './docsLayoutUtils'
import './DocsLayout.scss'

export { DOCS_EDITOR_MAX_WIDTH } from './docsLayoutUtils'

type LeftPanelVisibility = 'collapsed' | 'expanded'

type DocsLayoutContextValue = {
  leftPanelVisibility: LeftPanelVisibility
  setLeftPanelVisibility: (visibility: LeftPanelVisibility) => void

  leftPanelWidth: number
  setLeftPanelWidth: (width: number) => void
  resetLeftPanelWidth: () => void
}

const DocsLayoutContext = React.createContext<DocsLayoutContextValue | null>(null)

export function useDocsLayoutContext(): DocsLayoutContextValue {
  const context = React.useContext(DocsLayoutContext)
  if (!context) {
    throw new Error('useDocsLayoutContext must be used within DocsLayoutProvider')
  }
  return context
}

function LeftPanel({ children }: React.PropsWithChildren) {
  const { setLeftPanelWidth, resetLeftPanelWidth, leftPanelVisibility } = useDocsLayoutContext()
  const [isDragging, setIsDragging] = React.useState(false)
  // store event listeners created on resize to cleanup on unmount if resize interrupted
  const cleanupRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    if (leftPanelVisibility === 'collapsed') {
      cleanupRef.current?.()
    }
    return () => {
      cleanupRef.current?.()
    }
  }, [leftPanelVisibility])

  function handleResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    cleanupRef.current?.()

    const handle = e.currentTarget
    const pointerId = e.pointerId
    handle.setPointerCapture(pointerId)
    const startX = e.clientX
    const leftPanel = handle.parentElement
    const startWidth = leftPanel?.offsetWidth ?? 0

    setIsDragging(true)

    function onPointerMove(moveEvent: PointerEvent) {
      setLeftPanelWidth(startWidth + (moveEvent.clientX - startX))
    }

    function cleanupListeners() {
      try {
        handle.releasePointerCapture(pointerId)
      } catch {
        // handle may already be unmounted
      }
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
      cleanupRef.current = null
      setIsDragging(false)
    }

    function onPointerUp() {
      cleanupListeners()
    }

    cleanupRef.current = cleanupListeners

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div
      className={clsx(
        'docs-layout-left-panel',
        leftPanelVisibility === 'expanded' && 'panel-open',
        isDragging && 'is-dragging',
      )}
    >
      {children}
      {leftPanelVisibility === 'expanded' && (
        <div
          aria-orientation="vertical"
          onPointerDown={handleResize}
          onDoubleClick={resetLeftPanelWidth}
          className="absolute bottom-0 right-0 top-0 h-full w-3 cursor-col-resize max-[815px]:hidden"
        >
          <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
        </div>
      )}
    </div>
  )
}

function RightPanel({ children }: React.PropsWithChildren) {
  return (
    <div className="docs-layout-right-panel">
      <div className="docs-layout-scroll-bleed">
        {/* Single-cell grid overlay for contextual comments and floating quick actions
        (portaled in CommentPluginContainer) */}
        <div className="docs-layout-editor-stack">
          <div className="docs-layout-editor-column">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Grid({ children }: React.PropsWithChildren) {
  const { leftPanelWidth } = useDocsLayoutContext()

  return (
    <div className="docs-layout-grid" style={{ '--left-panel-layout-width': `${leftPanelWidth}px` }}>
      {children}
    </div>
  )
}

function DocsLayoutProvider({ children }: React.PropsWithChildren) {
  const [leftPanelVisibility, setLeftPanelVisibilityState] = React.useState<LeftPanelVisibility>('collapsed')
  const [leftPanelWidth, setLeftPanelWidthState] = React.useState(0)
  const persistedLeftPanelWidthRef = React.useRef<number | null>(null)

  const setLeftPanelVisibility = React.useCallback((visibility: LeftPanelVisibility) => {
    setLeftPanelVisibilityState(visibility)

    if (visibility === 'collapsed') {
      setLeftPanelWidthState(0)
      return
    }

    const viewportWidth = window.innerWidth
    const width = persistedLeftPanelWidthRef.current ?? getDefaultLeftPanelWidth(viewportWidth)
    setLeftPanelWidthState(clampLeftPanelWidth(width, viewportWidth))
  }, [])

  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth < DOCS_EDITOR_MAX_WIDTH) {
        setLeftPanelVisibility('collapsed')
        return
      }

      if (leftPanelVisibility === 'expanded') {
        setLeftPanelWidthState((width) => clampLeftPanelWidth(width, window.innerWidth))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftPanelVisibility, setLeftPanelVisibility])

  const setLeftPanelWidth = React.useCallback((width: number) => {
    const clampedWidth = clampLeftPanelWidth(width, window.innerWidth)
    setLeftPanelWidthState(clampedWidth)
    persistedLeftPanelWidthRef.current = clampedWidth
  }, [])

  const resetLeftPanelWidth = React.useCallback(() => {
    const defaultWidth = getDefaultLeftPanelWidth(window.innerWidth)
    setLeftPanelWidthState(defaultWidth)
    persistedLeftPanelWidthRef.current = defaultWidth
  }, [])

  return (
    <DocsLayoutContext.Provider
      value={{
        leftPanelVisibility,
        setLeftPanelVisibility,
        leftPanelWidth,
        setLeftPanelWidth,
        resetLeftPanelWidth,
      }}
    >
      {children}
    </DocsLayoutContext.Provider>
  )
}

interface ContainerProps {
  isSuggestionMode: boolean
}

function Container({ children, isSuggestionMode }: React.PropsWithChildren<ContainerProps>) {
  return (
    <DocsLayoutProvider>
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
    </DocsLayoutProvider>
  )
}

export default {
  Container,
  Grid,
  LeftPanel,
  RightPanel,
}
