import React from 'react'
import clsx from '@proton/utils/clsx'
import { useMediaQuery } from '../Hooks/useMediaQuery'

const EDITOR_WIDTH = 816
const MIN_LEFT_PANEL_WIDTH = 100
const MAX_LEFT_PANEL_WIDTH = 800
// breakpoint at which the left panel is enabled
const ENABLED_LEFT_PANEL_BREAKPOINT = 1024

function LeftPanel({ children }: React.PropsWithChildren) {
  const { updateLeftPanelWidth, leftPanelWidth, defaultLeftPanelWidth, leftPanelActive, leftPanelEnabled } =
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

  function handleResetToDefault() {
    updateLeftPanelWidth(defaultLeftPanelWidth)
  }

  if (!leftPanelEnabled) {
    return null
  }

  if (leftPanelActive) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          gridRow: 1,
          gridColumn: '1 / 2',
        }}
        onMouseEnter={() => setCanResize(true)}
        onMouseLeave={() => setCanResize(false)}
        onMouseOver={() => setCanResize(true)}
        onFocus={() => setCanResize(true)}
      >
        {children}
        <div
          aria-orientation="vertical"
          onPointerDown={handleResize}
          onDoubleClick={handleResetToDefault}
          className="absolute bottom-0 right-0 top-0 h-full w-3 cursor-col-resize transition-all"
          style={{ opacity: canResize ? 1 : 0 }}
        >
          <div className="mx-auto h-full w-[1px] bg-[--border-weak]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        gridRow: 1,
        gridColumn: '1 / 2',
      }}
    >
      {children}
    </div>
  )
}

function RightPanel({ children }: React.PropsWithChildren) {
  const { leftPanelWidth } = useDocsLayoutContext()
  return (
    <div
      className="relative grid scroll-pt-[20px] overflow-auto"
      style={{
        gridRow: 1,
        gridColumn: '2 / 3',
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
  setLeftPanelActive: (active: boolean) => void
  leftPanelEnabled: boolean
}

const DocsLayoutContext = React.createContext<DocsLayoutContextValue>({
  leftPanelWidth: 0,
  defaultLeftPanelWidth: 0,
  updateLeftPanelWidth: () => {},
  leftPanelActive: false,
  setLeftPanelActive: () => {},
  leftPanelEnabled: false,
})

export function useDocsLayoutContext() {
  return React.useContext(DocsLayoutContext)
}

function DocsLayoutProvider({ children }: React.PropsWithChildren) {
  const leftPanelEnabled = useMediaQuery(`only screen and (min-width: ${ENABLED_LEFT_PANEL_BREAKPOINT}px)`)
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

  function getDefaultWidth() {
    return (window.innerWidth - EDITOR_WIDTH) / 2
  }

  function updateLeftPanelWidth(width: number) {
    setLeftPanelWidth(Math.min(Math.max(width, MIN_LEFT_PANEL_WIDTH), MAX_LEFT_PANEL_WIDTH))
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
      }}
    >
      {children}
    </DocsLayoutContext.Provider>
  )
}

interface ContainerProps {
  isSuggestionMode: boolean
}

function Container({ isSuggestionMode, children }: React.PropsWithChildren<ContainerProps>) {
  return (
    <DocsLayoutProvider>
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
