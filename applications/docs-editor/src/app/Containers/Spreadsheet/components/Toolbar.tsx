import { NEW_TOOLBAR } from '../constants'
import { OldToolbar } from './OldToolbar'
import type { ProtonSheetsState } from '../state'

export type ToolbarProps = {
  state: ProtonSheetsState
  downloadLogs: () => void
  isReadonly: boolean
}

export function Toolbar({ state, downloadLogs, isReadonly }: ToolbarProps) {
  if (!NEW_TOOLBAR) {
    return <OldToolbar state={state} downloadLogs={downloadLogs} isReadonly={isReadonly} />
  }

  return <div>WIP</div>
}
