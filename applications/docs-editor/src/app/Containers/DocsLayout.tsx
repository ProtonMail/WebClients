import React from 'react'
import clsx from '@proton/utils/clsx'
import { useMediaQuery } from '../Hooks/useMediaQuery'

// screen breakpoint at which the left panel is enabled
const LEFT_PANEL_ENABLED_BREAKPOINT = 1024
const EDITOR_WIDTH = 816
// screen breakpoint used to determine the minimum allowed width of the left panel
const LEFT_PANEL_MIN_WIDTH_BREAKPOINT = 1300
const MIN_LEFT_PANEL_WIDTH_GREATER_THAN_BREAKPOINT = 260
const MIN_LEFT_PANEL_WIDTH_LESS_THAN_BREAKPOINT = 100
const MAX_LEFT_PANEL_WIDTH = 800

function LeftPanel({ children }: React.PropsWithChildren) {
  const { updateLeftPanelWidth, leftPanelWidth, resetLeftPanelToDefault, leftPanelActive, leftPanelEnabled } =
    useDocsLayoutContext()
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
    const startWidth = leftPanelWidth

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

  if (!leftPanelEnabled) {
    return null
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        gridRow: 1,
        gridColumn: '1 / 2',
      }}
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
          className="absolute bottom-0 right-0 top-0 h-full w-3 cursor-col-resize transition-all"
          style={{ opacity: canResize ? 1 : 0 }}
        >
          <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
        </div>
      )}
    </div>
  )
}

function RightPanel({ children }: React.PropsWithChildren) {
  const { leftPanelWidth, leftPanelEnabled } = useDocsLayoutContext()
  return (
    <div
      className="relative grid scroll-pt-[20px] overflow-auto"
      style={{
        gridRow: 1,
        gridColumn: leftPanelEnabled ? '2 / 3' : 1,
        '--right-panel-padding': `calc((100% + ${leftPanelWidth}px - ${EDITOR_WIDTH}px) / 2)`,
      }}
    >
      {children}
    </div>
  )
}

function Grid({ children }: React.PropsWithChildren) {
  const { leftPanelWidth, leftPanelEnabled } = useDocsLayoutContext()

  return (
    <div
      id="docs-layout-grid"
      className="grid overflow-x-hidden overflow-y-scroll"
      style={{
        gridTemplateRows: '1fr',
        gridTemplateColumns: leftPanelEnabled ? `${leftPanelWidth}px minmax(0, 1fr)` : '1fr',
      }}
    >
      {children}
    </div>
  )
}

type DocsLayoutContextValue = {
  leftPanelWidth: number
  updateLeftPanelWidth: (width: number) => void
  defaultLeftPanelWidth: number
  leftPanelActive: boolean
  setLeftPanelActive: React.Dispatch<React.SetStateAction<boolean>>
  leftPanelEnabled: boolean
  resetLeftPanelToDefault: () => void
}

const DocsLayoutContext = React.createContext<DocsLayoutContextValue>({
  leftPanelWidth: 0,
  defaultLeftPanelWidth: 0,
  updateLeftPanelWidth: () => {},
  leftPanelActive: false,
  setLeftPanelActive: () => {},
  leftPanelEnabled: false,
  resetLeftPanelToDefault: () => {},
})

export function useDocsLayoutContext() {
  return React.useContext(DocsLayoutContext)
}

interface DocsLayoutProviderProps {
  tableOfContentsVisible: boolean
}

function DocsLayoutProvider({ children, tableOfContentsVisible }: React.PropsWithChildren<DocsLayoutProviderProps>) {
  const leftPanelEnabled = useMediaQuery(`only screen and (min-width: ${LEFT_PANEL_ENABLED_BREAKPOINT}px)`)
  const isGreaterThanBreakpoint = useMediaQuery(`only screen and (min-width: ${LEFT_PANEL_MIN_WIDTH_BREAKPOINT}px)`)

  const [defaultLeftPanelWidth, setDefaultLeftPanelWidth] = React.useState<number>(0)
  const [leftPanelWidth, setLeftPanelWidth] = React.useState<number>(0)
  const [leftPanelActive, setLeftPanelActive] = React.useState<boolean>(false)

  React.useLayoutEffect(() => {
    const defaultWidth = getDefaultWidth()
    setLeftPanelWidth(defaultWidth)
    setDefaultLeftPanelWidth(defaultWidth)

    function handleResize() {
      const defaultWidth = getDefaultWidth()
      setDefaultLeftPanelWidth(defaultWidth)
      setLeftPanelWidth(defaultWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const updateLeftPanelWidth = React.useCallback(
    (width: number) => {
      if (isGreaterThanBreakpoint) {
        setLeftPanelWidth(Math.min(Math.max(width, MIN_LEFT_PANEL_WIDTH_GREATER_THAN_BREAKPOINT), MAX_LEFT_PANEL_WIDTH))
      } else {
        setLeftPanelWidth(Math.min(Math.max(width, MIN_LEFT_PANEL_WIDTH_LESS_THAN_BREAKPOINT), MAX_LEFT_PANEL_WIDTH))
      }
    },
    [isGreaterThanBreakpoint],
  )

  const resetLeftPanelToDefault = React.useCallback(() => {
    updateLeftPanelWidth(defaultLeftPanelWidth)
  }, [defaultLeftPanelWidth, updateLeftPanelWidth])

  React.useEffect(() => {
    if (!tableOfContentsVisible) {
      resetLeftPanelToDefault()
    }
  }, [tableOfContentsVisible, resetLeftPanelToDefault])

  function getDefaultWidth() {
    return (window.innerWidth - EDITOR_WIDTH) / 2
  }

  return (
    <DocsLayoutContext.Provider
      value={{
        defaultLeftPanelWidth,
        leftPanelWidth,
        updateLeftPanelWidth,
        leftPanelActive,
        setLeftPanelActive,
        leftPanelEnabled,
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
