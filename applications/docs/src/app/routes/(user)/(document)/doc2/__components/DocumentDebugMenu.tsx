import { type ReactNode, Suspense, lazy, useEffect, useState } from 'react'

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner'
import { Button } from '@proton/atoms/Button/Button'
import { Badge } from '@proton/components/components/badge/Badge'
import Details from '@proton/components/components/container/Details'
import Summary from '@proton/components/components/container/Summary'
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel'
import { IcCross } from '@proton/icons/icons/IcCross'
import downloadFile from '@proton/shared/lib/helpers/downloadFile'
import { SquashError, version } from '@proton-docs/realtime-sdk'
import type { Session, SessionSnapshot } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import type { EditorInvoker } from '../__utils/EditorInvoker'
import { downloadLogs, getAllUpdatesZip, getBaseCommitZip } from '../__utils/debugDownloads'
import type { UpdateRecorder } from '../__utils/UpdateRecorder'

const UpdateReplayTool = lazy(() => import('./UpdateReplayTool'))

export type DocumentDebugMenuProps = {
  session: Pick<Session, 'config' | 'squash' | 'exportDebugArtifacts' | 'getBaseState'>
  snapshot: SessionSnapshot
  editorInvoker: Pick<
    EditorInvoker,
    'getClientId' | 'getYDocAsJSON' | 'getCurrentEditorState' | 'toggleDebugTreeView' | 'receiveMessage'
  >
  recorder: UpdateRecorder
  /** Sends an update as the user's edit, recording it as the editor's own are */
  sendUpdate: (update: Uint8Array<ArrayBuffer>) => void
}

type SquashState = 'squashing' | 'squashed' | { nothingToMerge: number } | { failed: string }

/** As `Session.squash` documents it: it keeps the oldest half, rounded down, merges the rest, and skips merging one */
function isWorthSquashing(updateCount: number) {
  return updateCount - Math.floor(updateCount * 0.5) >= 2
}

/**
 * /doc's debug menu (`components/document/DocumentViewer/DebugMenu.tsx`) for doc2, on the realtime SDK. Like /doc's, it
 * is in English only, for the engineers who turn debug mode on. It reads the document only on a click, and logs none
 * of it. /doc's Commit with RTS, Close Connection and Create Initial Commit are left out: the SDK has no API for them.
 */
export function DocumentDebugMenu({ session, snapshot, editorInvoker, recorder, sendUpdate }: DocumentDebugMenuProps) {
  const { logger } = useApplication()
  const [isOpen, setIsOpen] = useState(false)
  const [editorClientId, setEditorClientId] = useState<number>()
  const [squashState, setSquashState] = useState<SquashState>()
  const [showUpdateReplayTool, setShowUpdateReplayTool] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    editorInvoker.getClientId().then(setEditorClientId, (error) => logger.error('Debug menu action failed', error))
  }, [editorInvoker, isOpen, logger])

  const logFailure = (action: () => Promise<void>) => () => {
    action().catch((error) => logger.error('Debug menu action failed', error))
  }

  const copyAsJSON = (read: () => Promise<unknown>) =>
    logFailure(async () => navigator.clipboard.writeText(JSON.stringify(await read())))

  const squash = async () => {
    setSquashState('squashing')
    const updateCount = session.getBaseState().updates.length
    try {
      await session.squash()
      setSquashState(isWorthSquashing(updateCount) ? 'squashed' : { nothingToMerge: updateCount })
    } catch (error) {
      if (error instanceof SquashError) {
        setSquashState({ failed: error.reason })
        return
      }
      logger.error('Debug menu squash failed', error as Error)
      setSquashState({ failed: 'unexpected error, see the logs' })
    }
  }

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-2 left-2 z-20 flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-2 hover:bg-[--background-strong]"
        onClick={() => setIsOpen(true)}
        data-testid="debug-menu-button"
      >
        <div className="sr-only">Debug menu</div>
        <IcCogWheel className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-2 left-2 z-20 flex flex-row-reverse items-end gap-2">
      {showUpdateReplayTool && (
        <Suspense fallback={<div>Loading...</div>}>
          <UpdateReplayTool
            onClose={() => setShowUpdateReplayTool(false)}
            editorInvoker={editorInvoker}
            persistUpdate={sendUpdate}
          />
        </Suspense>
      )}
      <div
        className="flex w-[22rem] max-w-[calc(100vw-1rem)] flex-col flex-nowrap gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left"
        data-testid="debug-menu"
      >
        <div className="mt-1 flex items-center justify-between gap-2 px-2 font-semibold">
          <div>Debug menu</div>
          <button
            className="flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-1 hover:bg-[--background-strong]"
            onClick={() => setIsOpen(false)}
          >
            <div className="sr-only">Close menu</div>
            <IcCross className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mb-1 flex max-h-[min(42rem,calc(100vh-2rem))] flex-col flex-nowrap gap-2 overflow-y-auto px-1 *:flex-shrink-0">
          <div className="flex flex-col gap-0.5 px-1" data-testid="debug-diagnostics">
            <div className="font-semibold">Diagnostics</div>
            <div className="color-weak text-sm">
              These actions do not modify the open document. Downloads and copied data may contain document content.
            </div>
            <Diagnostic label="Session client ID">{session.config.clientId}</Diagnostic>
            <Diagnostic label="Editor client ID">{editorClientId ?? '…'}</Diagnostic>
            <Diagnostic label="Base commit">{snapshot.baseCommitId ?? 'none'}</Diagnostic>
            <Diagnostic label="Status">{snapshot.status.name}</Diagnostic>
            <Diagnostic label="Delivery">{snapshot.delivery}</Diagnostic>
            <Diagnostic label="SDK version">{version}</Diagnostic>
          </div>

          <Button size="small" onClick={copyAsJSON(() => editorInvoker.getYDocAsJSON())}>
            Copy Y.Doc as JSON
          </Button>
          <Button size="small" onClick={copyAsJSON(() => editorInvoker.getCurrentEditorState())}>
            Copy Editor State as JSON
          </Button>
          <Button size="small" onClick={logFailure(() => editorInvoker.toggleDebugTreeView())}>
            Toggle Tree View
          </Button>
          <Button size="small" onClick={logFailure(() => downloadLogs(editorInvoker))}>
            Download Current State as ZIP
          </Button>
          <Button
            size="small"
            onClick={logFailure(async () =>
              downloadFile(
                await getBaseCommitZip(session.exportDebugArtifacts().baseCommit),
                'all-updates-in-base-commit.zip',
              ),
            )}
          >
            Download Base Commit Updates
          </Button>
          <Button
            size="small"
            onClick={logFailure(async () =>
              downloadFile(await getAllUpdatesZip(recorder.getUpdates()), 'all-updates.zip'),
            )}
          >
            Download All Updates as ZIP
          </Button>

          <Details className="rounded border border-[--signal-danger] bg-[--background-norm]">
            <Summary className="px-2 py-2" classNameChildren="flex items-center justify-between gap-2 font-semibold">
              <span>State-changing actions</span>
              <Badge type="error" className="m-0">
                DANGEROUS
              </Badge>
            </Summary>
            <div className="flex flex-col gap-2 border-t border-[--signal-danger] p-2">
              <Banner variant={BannerVariants.DANGER}>
                <div className="flex flex-col gap-1">
                  <div>
                    Use these actions only when Proton Support or a developer instructs you. They can change the
                    document, discard recovery data, or interrupt syncing. You may not be able to undo the result.
                  </div>
                  <div className="font-semibold">
                    To protect the original, make a copy of the document and run these actions on the copy whenever
                    possible.
                  </div>
                </div>
              </Banner>
              <Button size="small" color="danger" onClick={squash} disabled={squashState === 'squashing'}>
                Squash now
              </Button>
              {squashState && (
                <div className="px-1 text-sm" data-testid="squash-result">
                  {squashState === 'squashing' && 'Squashing…'}
                  {squashState === 'squashed' && 'Squashed'}
                  {typeof squashState === 'object' &&
                    ('failed' in squashState
                      ? `Squash failed: ${squashState.failed}`
                      : `Nothing to squash: the base commit has ${squashState.nothingToMerge} updates`)}
                </div>
              )}
              <Button size="small" color="danger" onClick={() => setShowUpdateReplayTool(true)}>
                Open Update Replay Tool
              </Button>
            </div>
          </Details>
        </div>
      </div>
    </div>
  )
}

type DiagnosticProps = { label: string; children: ReactNode }

function Diagnostic({ label, children }: DiagnosticProps) {
  return (
    <div className="text-sm">
      {label}: <span className="text-monospace">{children}</span>
    </div>
  )
}
