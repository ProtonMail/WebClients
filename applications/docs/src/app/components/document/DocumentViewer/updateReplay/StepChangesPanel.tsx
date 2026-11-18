import { Button } from '@proton/atoms/Button/Button'
import clsx from '@proton/utils/clsx'
import { useMemo, useState } from 'react'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'
import type { CellHold, ChangeHoldState } from './cellHolds'
import { getActiveHolds, getChangeHoldState, getHeldCellText, getHoldReleaseStep, groupHoldsByCell } from './cellHolds'
import type { CellAddress, ReplaySnapshot } from './replaySnapshot'
import { getCellLabel, getSheetTitle } from './replaySnapshot'
import type { CellChange } from './stepChanges'
import type { UpdateReplayToolState } from './createUpdateReplayToolStore'

/**
 * Rendering thousands of rows (a big paste, or "Hold all" on one) freezes the tool: "Hold all" on a 50,000-cell
 * step took close to two minutes. Changes past this are still held by "Hold all", and holds past it still apply.
 */
const MAX_LISTED_ROWS = 200

export type StepChangesPanelProps = {
  store: StoreApi<UpdateReplayToolState>
}

export function StepChangesPanel({ store }: StepChangesPanelProps) {
  const step = useStore(store, (state) => state.timeTravelIndex)
  const snapshots = useStore(store, (state) => state.snapshots)
  const stepChanges = useStore(store, (state) => state.stepChanges)
  const stepUpdateCounts = useStore(store, (state) => state.stepUpdateCounts)
  const holds = useStore(store, (state) => state.holds)
  const shouldHighlightChanges = useStore(store, (state) => state.shouldHighlightChanges)
  const hasAppliedRepairedState = useStore(store, (state) => state.hasAppliedRepairedState)
  const hasAppliedUnpersistedUpdates = useStore(store, (state) => state.hasAppliedUnpersistedUpdates)
  const {
    setShouldHighlightChanges,
    holdCellChange,
    releaseCellChange,
    holdAllCellChangesInStep,
    removeHold,
    goToCell,
    goToSnapshot,
    downloadRepairedState,
    applyRepairedState,
  } = store.getState()
  const [isBusy, setIsBusy] = useState(false)
  const holdsByCell = useMemo(() => groupHoldsByCell(holds), [holds])

  const snapshot = snapshots[step]
  const changes = stepChanges[step]
  if (!snapshot || !changes) {
    return null
  }

  const run = (action: () => Promise<void>) => {
    setIsBusy(true)
    action()
      .catch(console.error)
      .finally(() => setIsBusy(false))
  }
  const activeHolds = getActiveHolds(holds, step, stepChanges)
  const latestStep = snapshots.length - 1
  const firstUpdate = (stepUpdateCounts[step - 1] ?? 0) + 1
  const lastUpdate = stepUpdateCounts[step] ?? 0

  return (
    <div className="flex flex-col gap-2 border-t border-[--border-weak] pt-2" data-testid="step-changes-panel">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">
          {step === 0
            ? 'Before replay'
            : `Step ${step}: ${firstUpdate === lastUpdate ? `update ${lastUpdate}` : `updates ${firstUpdate}–${lastUpdate}`}`}
        </div>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            className="!opacity-100"
            checked={shouldHighlightChanges}
            onChange={(event) => run(() => setShouldHighlightChanges(event.target.checked))}
          />
          Highlight
        </label>
      </div>

      {[...changes.structurallyChangedSheetIds].map((sheetId) => (
        <div key={sheetId} className="text-sm text-[--signal-warning]">
          {getSheetTitle(snapshots[step - 1] ?? snapshot, sheetId)} was resized or removed: cell positions may have
          shifted, so holds on it end here.
        </div>
      ))}
      {changes.otherChangedKeys.length > 0 && (
        <div className="text-sm text-[--text-weak]">
          Also changed (cannot be held): {changes.otherChangedKeys.join(', ')}
        </div>
      )}

      {step > 0 && (
        <CellChangeList
          changes={changes.cellChanges}
          snapshot={snapshot}
          getHeldText={(hold) => getHeldCellText(hold, snapshots)}
          getHoldState={(change) => getChangeHoldState(holdsByCell, change, step, stepChanges)}
          isBusy={isBusy || hasAppliedRepairedState}
          onHold={(change) => run(() => holdCellChange(change))}
          onRelease={(change) => run(() => releaseCellChange(change))}
          onHoldAll={() => run(holdAllCellChangesInStep)}
          onGoToCell={(cell) => run(() => goToCell(cell))}
        />
      )}

      <ActiveHoldList
        holds={activeHolds}
        snapshot={snapshot}
        getReleaseStep={(hold) => getHoldReleaseStep(hold, stepChanges)}
        isBusy={isBusy || hasAppliedRepairedState}
        onRemove={(hold) => run(() => removeHold(hold))}
        onGoToStep={(hold) => run(() => goToSnapshot(hold.fromStep))}
        onGoToCell={(cell) => run(() => goToCell(cell))}
      />

      <div className="flex flex-col gap-1.5 border-t border-[--border-weak] pt-2">
        <div className="text-sm text-[--text-weak]">
          The repaired state is step {latestStep} with {holds.length === 1 ? '1 hold' : `${holds.length} holds`}{' '}
          applied.
        </div>
        <Button size="small" onClick={downloadRepairedState} disabled={isBusy}>
          Download repaired state
        </Button>
        {hasAppliedUnpersistedUpdates && (
          <div className="text-sm text-[--text-weak]">
            To apply the repair, replay with "Persist applied updates" checked from the first update: the repair is
            saved on top of the replayed updates, so the server needs them too.
          </div>
        )}
        <Button
          size="small"
          color="danger"
          disabled={isBusy || hasAppliedRepairedState || hasAppliedUnpersistedUpdates}
          onClick={() => {
            if (
              window.confirm(
                'Write the repaired state into this document? It is saved as new changes, like restoring a version. Replay stops afterwards.',
              )
            ) {
              run(applyRepairedState)
            }
          }}
        >
          {hasAppliedRepairedState ? 'Repaired state applied' : 'Apply repaired state to document'}
        </Button>
      </div>
    </div>
  )
}

type CellChangeListProps = {
  changes: CellChange[]
  snapshot: ReplaySnapshot
  getHeldText: (hold: CellHold) => string
  getHoldState: (change: CellChange) => ChangeHoldState
  isBusy: boolean
  onHold: (change: CellChange) => void
  onRelease: (change: CellChange) => void
  onHoldAll: () => void
  onGoToCell: (cell: CellAddress) => void
}

function CellChangeList({
  changes,
  snapshot,
  getHeldText,
  getHoldState,
  isBusy,
  onHold,
  onRelease,
  onHoldAll,
  onGoToCell,
}: CellChangeListProps) {
  if (changes.length === 0) {
    return <div className="text-sm text-[--text-weak]">No cell changes in this step.</div>
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{changes.length === 1 ? '1 changed cell' : `${changes.length} changed cells`}</span>
        <Button size="small" onClick={onHoldAll} disabled={isBusy}>
          Hold all
        </Button>
      </div>
      <ul className="m-0 flex max-h-[16rem] list-none flex-col gap-1 overflow-y-auto p-0">
        {changes.slice(0, MAX_LISTED_ROWS).map((change) => (
          <CellChangeRow
            key={`${change.sheetId}:${change.rowIndex}:${change.columnIndex}`}
            change={change}
            snapshot={snapshot}
            getHeldText={getHeldText}
            holdState={getHoldState(change)}
            isBusy={isBusy}
            onHold={() => onHold(change)}
            onRelease={() => onRelease(change)}
            onGoToCell={() => onGoToCell(change)}
          />
        ))}
      </ul>
      {changes.length > MAX_LISTED_ROWS && (
        <div className="text-sm text-[--text-weak]">
          {changes.length - MAX_LISTED_ROWS} more not listed; "Hold all" includes them.
        </div>
      )}
    </div>
  )
}

const changeKindClassNames: Record<CellChange['kind'], string> = {
  added: 'text-[--signal-success]',
  deleted: 'text-[--signal-danger]',
  modified: 'text-[--signal-info]',
}

type CellChangeRowProps = {
  change: CellChange
  snapshot: ReplaySnapshot
  getHeldText: (hold: CellHold) => string
  holdState: ChangeHoldState
  isBusy: boolean
  onHold: () => void
  onRelease: () => void
  onGoToCell: () => void
}

function CellChangeRow({
  change,
  snapshot,
  getHeldText,
  holdState,
  isBusy,
  onHold,
  onRelease,
  onGoToCell,
}: CellChangeRowProps) {
  const isHeld = holdState.type === 'held' || holdState.type === 'kept'
  return (
    <li
      className={clsx(
        'flex flex-col gap-0.5 rounded border border-[--border-weak] px-2 py-1 text-sm',
        isHeld && 'border-[--signal-warning] bg-[--background-strong]',
      )}
      data-testid="cell-change"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="font-mono underline"
          onClick={onGoToCell}
          title="Select this cell in the sheet"
        >
          {getSheetTitle(snapshot, change.sheetId)}!{getCellLabel(change)}
        </button>
        <span className={changeKindClassNames[change.kind]}>
          {change.kind}
          {change.kind === 'modified' && !change.valueChanged && ' (format)'}
        </span>
        <HoldButton holdState={holdState} isBusy={isBusy} onHold={onHold} onRelease={onRelease} />
      </div>
      <div className="truncate text-[--text-weak]" title={`${change.textBefore} → ${change.textAfter}`}>
        <span className="line-through">{change.textBefore || '∅'}</span> → {change.textAfter || '∅'}
      </div>
      {holdState.type === 'kept' && (
        <div className="text-[--signal-warning]">
          Kept holding "{getHeldText(holdState.hold)}" from step {holdState.hold.fromStep}
        </div>
      )}
      {holdState.type === 'overwrites-hold' && (
        <div className="text-[--text-weak]">
          Ends the hold on "{getHeldText(holdState.hold)}" from step {holdState.hold.fromStep}
        </div>
      )}
    </li>
  )
}

type HoldButtonProps = {
  holdState: ChangeHoldState
  isBusy: boolean
  onHold: () => void
  onRelease: () => void
}

function HoldButton({ holdState, isBusy, onHold, onRelease }: HoldButtonProps) {
  if (holdState.type === 'held' || holdState.type === 'kept') {
    return (
      <Button size="small" color="warning" onClick={onRelease} disabled={isBusy} data-testid="release-change">
        Release
      </Button>
    )
  }
  return (
    <Button size="small" onClick={onHold} disabled={isBusy} data-testid="hold-change">
      {holdState.type === 'overwrites-hold' ? 'Keep holding' : 'Hold'}
    </Button>
  )
}

type ActiveHoldListProps = {
  holds: CellHold[]
  snapshot: ReplaySnapshot
  getReleaseStep: (hold: CellHold) => number | null
  isBusy: boolean
  onRemove: (hold: CellHold) => void
  onGoToStep: (hold: CellHold) => void
  onGoToCell: (cell: CellAddress) => void
}

function ActiveHoldList({
  holds,
  snapshot,
  getReleaseStep,
  isBusy,
  onRemove,
  onGoToStep,
  onGoToCell,
}: ActiveHoldListProps) {
  if (holds.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-semibold">Held at this step ({holds.length})</div>
      <ul className="m-0 flex max-h-[10rem] list-none flex-col gap-1 overflow-y-auto p-0">
        {holds.slice(0, MAX_LISTED_ROWS).map((hold) => {
          const releaseStep = getReleaseStep(hold)
          return (
            <li
              key={`${hold.sheetId}:${hold.rowIndex}:${hold.columnIndex}:${hold.fromStep}`}
              className="flex items-center justify-between gap-2 text-sm"
              data-testid="active-hold"
            >
              <button type="button" className="font-mono underline" onClick={() => onGoToCell(hold)}>
                {getSheetTitle(snapshot, hold.sheetId)}!{getCellLabel(hold)}
              </button>
              <button type="button" className="underline" onClick={() => onGoToStep(hold)}>
                step {hold.fromStep}
              </button>
              <span className="text-[--text-weak]">{releaseStep === null ? 'to the end' : `until ${releaseStep}`}</span>
              <Button size="small" onClick={() => onRemove(hold)} disabled={isBusy}>
                Remove
              </Button>
            </li>
          )
        })}
      </ul>
      {holds.length > MAX_LISTED_ROWS && (
        <div className="text-sm text-[--text-weak]">{holds.length - MAX_LISTED_ROWS} more not listed.</div>
      )}
    </div>
  )
}
