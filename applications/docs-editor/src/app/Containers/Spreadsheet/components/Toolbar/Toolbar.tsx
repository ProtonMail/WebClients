import { OldToolbar } from './OldToolbar'
import type { ProtonSheetsState } from '../../state'
import { useEffect, useState, type ComponentPropsWithRef } from 'react'
import { c } from 'ttag'
import { Container, Group, Item, Row, Separator } from './primitives'
import { InsertMenu } from './InsertMenu'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {
  state: ProtonSheetsState
  downloadLogs: () => void
  isReadonly: boolean
}

export function Toolbar({ state, downloadLogs, isReadonly, ...props }: ToolbarProps) {
  const newToolbarEnabled = useNewToolbarEnabled()
  if (!newToolbarEnabled) {
    return <OldToolbar state={state} downloadLogs={downloadLogs} isReadonly={isReadonly} />
  }

  return (
    <Container {...props}>
      <Group>
        <Row>
          <Item icon="arrow-up-and-left" onClick={state.onUndo} disabled={!state.canUndo}>{c(
            'sheets_2025:Spreadsheet editor toolbar',
          ).t`Undo`}</Item>
          <Item
            icon="arrow-up-and-left"
            className="[&_svg]:-scale-x-100"
            onClick={state.onRedo}
            disabled={!state.canRedo}
          >{c('sheets_2025:Spreadsheet editor toolbar').t`Redo`}</Item>
        </Row>
        <Row>
          <Item icon="magnifier" onClick={state.searchState.onRequestSearch}>{c(
            'sheets_2025:Spreadsheet editor toolbar',
          ).t`Search`}</Item>
          <Item
            icon="eraser"
            onClick={() => {
              state.onClearFormatting(state.activeSheetId, state.activeCell, state.selections)
            }}
          >{c('sheets_2025:Spreadsheet editor toolbar').t`Clear formatting`}</Item>
        </Row>
      </Group>
      <Separator />
      <Group>
        <InsertMenu state={state} />
      </Group>
      <Separator />
    </Container>
  )
}

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
  'Enter',
]

/**
 * Use the konami code to toggle the new toolbar. Stored in localStorage.
 */
function useNewToolbarEnabled() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('newToolbarEnabled') === 'true')
  const [, setInput] = useState<string[]>([])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      setInput((prev) => {
        const next = [...prev, event.key].slice(-KONAMI_SEQUENCE.length)
        if (next.join(',') === KONAMI_SEQUENCE.join(',')) {
          setEnabled((prevEnabled) => {
            const newValue = !prevEnabled
            localStorage.setItem('newToolbarEnabled', String(newValue))
            return newValue
          })
          return []
        }
        return next
      })
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  return enabled
}
