import React from 'react'
import clsx from '@proton/utils/clsx'
import './DocsLayout.scss'

export const DOCS_EDITOR_MAX_WIDTH = 816

const LEFT_PANEL_MIN_WIDTH_BREAKPOINT = 1300
const MIN_LEFT_PANEL_WIDTH_GREATER_THAN_BREAKPOINT = 260
const MIN_LEFT_PANEL_WIDTH_LESS_THAN_BREAKPOINT = 100
const MAX_LEFT_PANEL_WIDTH = 800

function getDesktopLeftPanelGutterWidth(viewportWidth: number) {
  return Math.max(0, (viewportWidth - DOCS_EDITOR_MAX_WIDTH) / 2)
}

function getDefaultLeftPanelOpenWidth(viewportWidth: number) {
  return viewportWidth >= LEFT_PANEL_MIN_WIDTH_BREAKPOINT
    ? MIN_LEFT_PANEL_WIDTH_GREATER_THAN_BREAKPOINT
    : MIN_LEFT_PANEL_WIDTH_LESS_THAN_BREAKPOINT
}

function LeftPanel({ children }: React.PropsWithChildren) {
  const { updateLeftPanelWidth, resetLeftPanelToDefault, leftPanelActive } = useDocsLayoutContext()
  const [canResize, setCanResize] = React.useState(false)
  // store event listeners created on resize to cleanup on unmount if resize interrupted
  const cleanupRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    if (!leftPanelActive) {
      cleanupRef.current?.()
    }
    return () => {
      cleanupRef.current?.()
    }
  }, [leftPanelActive])

  function handleResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    cleanupRef.current?.()

    const handle = e.currentTarget
    const pointerId = e.pointerId
    handle.setPointerCapture(pointerId)
    const startX = e.clientX
    const leftPanel = handle.parentElement
    const startWidth = leftPanel?.offsetWidth ?? 0

    function onPointerMove(moveEvent: PointerEvent) {
      updateLeftPanelWidth(startWidth + (moveEvent.clientX - startX))
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
      className={clsx('docs-layout-left-panel relative', leftPanelActive && 'panel-open')}
      onMouseEnter={leftPanelActive ? () => setCanResize(true) : undefined}
      onMouseLeave={leftPanelActive ? () => setCanResize(false) : undefined}
      onMouseOver={leftPanelActive ? () => setCanResize(true) : undefined}
      onFocus={leftPanelActive ? () => setCanResize(true) : undefined}
    >
      {children}
      {leftPanelActive && (
        <div
          aria-orientation="vertical"
          onPointerDown={handleResize}
          onDoubleClick={resetLeftPanelToDefault}
          className="absolute bottom-0 right-0 top-0 h-full w-3 cursor-col-resize transition-all max-[815px]:hidden"
          style={{ opacity: canResize ? 1 : 0 }}
        >
          <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
        </div>
      )}
    </div>
  )
}

function RightPanel({ children }: React.PropsWithChildren) {
  return <div className="docs-layout-right-panel relative grid scroll-pt-[20px] overflow-auto">{children}</div>
}

function Grid({ children }: React.PropsWithChildren) {
  const { leftPanelWidth, hasUserResized } = useDocsLayoutContext()

  return (
    <div
      className={clsx('docs-layout-grid grid', hasUserResized && 'user-resized')}
      style={hasUserResized ? { '--left-panel-width': `${leftPanelWidth}px` } : undefined}
    >
      {children}
    </div>
  )
}

type DocsLayoutContextValue = {
  leftPanelWidth: number
  hasUserResized: boolean
  updateLeftPanelWidth: (width: number) => void
  leftPanelActive: boolean
  setLeftPanelActive: React.Dispatch<React.SetStateAction<boolean>>
  resetLeftPanelToDefault: () => void
}

const DocsLayoutContext = React.createContext<DocsLayoutContextValue>({
  leftPanelWidth: 0,
  hasUserResized: false,
  updateLeftPanelWidth: () => {},
  leftPanelActive: false,
  setLeftPanelActive: () => {},
  resetLeftPanelToDefault: () => {},
})

export function useDocsLayoutContext() {
  return React.useContext(DocsLayoutContext)
}

interface DocsLayoutProviderProps {
  tableOfContentsVisible: boolean
}

function DocsLayoutProvider({ children, tableOfContentsVisible }: React.PropsWithChildren<DocsLayoutProviderProps>) {
  const [leftPanelWidth, setLeftPanelWidth] = React.useState<number>(0)
  const [hasUserResized, setHasUserResized] = React.useState<boolean>(false)
  const [leftPanelActive, setLeftPanelActive] = React.useState<boolean>(false)

  React.useEffect(() => {
    function applyOpenPanelWidth() {
      const gutterWidth = getDesktopLeftPanelGutterWidth(window.innerWidth)
      const openWidth = Math.max(gutterWidth, getDefaultLeftPanelOpenWidth(window.innerWidth))

      if (openWidth > gutterWidth) {
        setLeftPanelWidth(openWidth)
        setHasUserResized(true)
      }
    }

    function handleResize() {
      setHasUserResized(false)

      if (window.innerWidth < DOCS_EDITOR_MAX_WIDTH) {
        setLeftPanelActive(false)
        return
      }

      if (leftPanelActive) {
        applyOpenPanelWidth()
      }
    }

    if (!leftPanelActive) {
      setHasUserResized(false)
    } else if (window.innerWidth >= DOCS_EDITOR_MAX_WIDTH) {
      applyOpenPanelWidth()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftPanelActive])

  const updateLeftPanelWidth = React.useCallback((width: number) => {
    const minWidth = getDefaultLeftPanelOpenWidth(window.innerWidth)

    setLeftPanelWidth(Math.min(Math.max(width, minWidth), MAX_LEFT_PANEL_WIDTH))
    setHasUserResized(true)
  }, [])

  const resetLeftPanelToDefault = React.useCallback(() => {
    setHasUserResized(false)
  }, [])

  React.useEffect(() => {
    if (!tableOfContentsVisible) {
      resetLeftPanelToDefault()
    }
  }, [tableOfContentsVisible, resetLeftPanelToDefault])

  return (
    <DocsLayoutContext.Provider
      value={{
        leftPanelWidth,
        hasUserResized,
        updateLeftPanelWidth,
        leftPanelActive,
        setLeftPanelActive,
        resetLeftPanelToDefault,
      }}
    >
      {children}
    </DocsLayoutContext.Provider>
  )
}

interface ContainerProps {
  isSuggestionMode: boolean
  tableOfContentsVisible: boolean
}

function Container({ children, isSuggestionMode, tableOfContentsVisible }: React.PropsWithChildren<ContainerProps>) {
  return (
    <DocsLayoutProvider tableOfContentsVisible={tableOfContentsVisible}>
      <div
        className={clsx('relative grid h-full w-full bg-[white]', isSuggestionMode && 'suggestion-mode')}
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
