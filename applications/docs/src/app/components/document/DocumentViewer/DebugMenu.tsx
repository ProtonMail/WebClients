import { useNotifications } from '@proton/app-context/useNotifications'
import { Button } from '@proton/atoms/Button/Button'
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner'
import { Badge } from '@proton/components/components/badge/Badge'
import Details from '@proton/components/components/container/Details'
import Summary from '@proton/components/components/container/Summary'
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel'
import { IcCross } from '@proton/icons/icons/IcCross'
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle'
import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { downloadLogsAsJSON } from '~/utils/downloadLogs'
import type {
  EditorControllerInterface,
  AuthenticatedDocControllerInterface,
  DocumentState,
  PublicDocumentState,
} from '@proton/docs-core'
import type { DocumentType } from '@proton/docs-shared'
import clsx from '@proton/utils/clsx'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { Tooltip } from '@proton/docs-shared/components/ui/ui'
import * as Ariakit from '@ariakit/react'

const UpdateReplayTool = lazy(() => import('./UpdateReplayTool'))

type FileInputButtonProps = {
  children: ReactNode
  onFileSelect: (file: File) => Promise<void>
}

function FileInputButton({ children, onFileSelect }: FileInputButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { createNotification } = useNotifications()

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label="Choose a file to apply"
        onChange={(event) => {
          const input = event.currentTarget
          const file = input.files?.[0]
          input.value = ''
          if (file) {
            void onFileSelect(file).catch((error) => {
              console.error(error)
              createNotification({
                type: 'error',
                text: c('Notification').t`Failed to apply file. Check the file and try again.`,
              })
            })
          }
        }}
      />
      <Button size="small" color="danger" onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
    </>
  )
}

export type DebugMenuProps = {
  docController?: AuthenticatedDocControllerInterface
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  documentType: DocumentType
}

export function DebugMenu({ docController, editorController, documentState, documentType }: DebugMenuProps) {
  const application = useApplication()

  const [isOpen, setIsOpen] = useState(false)
  const [clientId, setClientId] = useState<string | null>()

  useEffect(() => {
    if (!isOpen) {
      return
    }
    void editorController.getDocumentClientId().then((id) => {
      setClientId(`${id}`)
    })
  }, [isOpen, editorController])

  const commitToRTS = async () => {
    if (!docController) {
      return
    }
    void docController.debugSendCommitCommandToRTS()
  }

  const squashDocument = async () => {
    if (!docController) {
      return
    }
    void docController.squashDocument()
  }

  const closeConnection = async () => {
    const { nodeMeta } = documentState.getProperty('entitlements')
    if (nodeMeta) {
      const code = parseInt(prompt('Close code (optional)') || ConnectionCloseReason.CODES.NORMAL_CLOSURE.toString())
      void application.websocketService.closeConnection(nodeMeta, code)
    }
  }

  const createInitialCommit = async () => {
    if (!docController) {
      return
    }
    const editorState = await editorController.getDocumentState()
    if (editorState) {
      void docController.createInitialCommitFromEditorState(editorState)
    }
  }

  const copyEditorJSON = async () => {
    const json = await editorController.getEditorJSON()
    if (!json) {
      return
    }

    const stringified = JSON.stringify(json)
    void navigator.clipboard.writeText(stringified)
  }

  const copyLatestSpreadsheetStateToLogJSON = async () => {
    const json = await editorController.getLocalSpreadsheetStateJSON()
    if (!json) {
      return
    }

    const stringified = JSON.stringify(json)
    void navigator.clipboard.writeText(stringified)
  }

  const copyYDocAsJSON = async () => {
    const yDocJSON = await editorController.getYDocAsJSON()
    if (!yDocJSON) {
      return
    }

    const stringified = JSON.stringify(yDocJSON)
    void navigator.clipboard.writeText(stringified)
  }

  const toggleDebugTreeView = () => {
    void editorController.toggleDebugTreeView()
  }

  const downloadYJSStateAsUpdate = async () => {
    const yjsStateAsUpdate = await editorController.getDocumentState()
    if (!yjsStateAsUpdate) {
      return
    }
    const blob = new Blob([yjsStateAsUpdate], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'yjs-state-as-update.bin'
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  const isDocument = documentType === 'doc'
  const isSpreadsheet = documentType === 'sheet'

  const [showUpdateReplayTool, setShowUpdateReplayTool] = useState(false)

  if (!isOpen) {
    return (
      <button
        id="debug-menu-button"
        className={clsx(
          'fixed bottom-2 z-20 flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-2 hover:bg-[--background-strong]',
          isSpreadsheet ? 'right-2' : 'left-2',
        )}
        onClick={() => setIsOpen(true)}
        data-testid="debug-menu-button"
      >
        <div className="sr-only">Debug menu</div>
        <IcCogWheel className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div
      className={clsx(
        'fixed bottom-2 z-20 flex items-end gap-2',
        isDocument && 'flex-row-reverse',
        isSpreadsheet ? 'right-2' : 'left-2',
      )}
    >
      {showUpdateReplayTool && (
        <Suspense fallback={<div>Loading...</div>}>
          <UpdateReplayTool
            onClose={() => setShowUpdateReplayTool(false)}
            editorController={editorController}
            isSpreadsheet={isSpreadsheet}
          />
        </Suspense>
      )}
      <div
        id="debug-menu"
        className={clsx(
          'flex w-[22rem] max-w-[calc(100vw-1rem)] flex-col flex-nowrap gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left',
        )}
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
          <div className="flex flex-col gap-0.5 px-1">
            <div className="font-semibold">Diagnostics</div>
            <div className="color-weak text-sm">
              These actions do not modify the open document. Downloads and copied data may contain document content.
            </div>
            {docController && <div className="mt-1 text-sm">Client ID: {clientId}</div>}
          </div>

          <Button size="small" onClick={copyYDocAsJSON}>
            Copy Y.Doc as JSON
          </Button>
          {isDocument && (
            <>
              <Button size="small" onClick={copyEditorJSON}>
                Copy Editor State as JSON
              </Button>
              <Button size="small" onClick={toggleDebugTreeView}>
                Toggle Tree View
              </Button>
            </>
          )}
          {isSpreadsheet && (
            <>
              <Button size="small" onClick={copyLatestSpreadsheetStateToLogJSON}>
                Copy Local Spreadsheet State as JSON
              </Button>
              <Button size="small" onClick={() => editorController.downloadSpreadsheetPatches()}>
                Download Stored Patches as JSON
                <Ariakit.TooltipProvider>
                  <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                    <IcInfoCircle />
                  </Ariakit.TooltipAnchor>
                  <Tooltip>
                    Downloads locally stored spreadsheet changes as JSON to inspect or replay when debugging
                  </Tooltip>
                </Ariakit.TooltipProvider>
              </Button>
              <Button size="small" onClick={() => editorController.downloadSpreadsheetActions()}>
                Download Stored Actions as JSON
                <Ariakit.TooltipProvider>
                  <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                    <IcInfoCircle />
                  </Ariakit.TooltipAnchor>
                  <Tooltip>Downloads locally stored spreadsheet actions as JSON to inspect when debugging</Tooltip>
                </Ariakit.TooltipProvider>
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const patches = await editorController.generateSpreadsheetPatches()
                  if (!patches) {
                    return
                  }
                  const stringifiedPatches = JSON.stringify(patches)
                  const blob = new Blob([stringifiedPatches], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'spreadsheet-state-patches.json'
                  a.click()
                  URL.revokeObjectURL(url)
                  a.remove()
                }}
              >
                Generate Patches from State
              </Button>
            </>
          )}
          <Button size="small" onClick={() => downloadLogsAsJSON(editorController, documentType)}>
            Download Current State as ZIP
            <Ariakit.TooltipProvider>
              <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                <IcInfoCircle />
              </Ariakit.TooltipAnchor>
              <Tooltip>
                {isSpreadsheet
                  ? 'Downloads the same Y.Doc and local spreadsheet state as the copy actions, as JSON files in one ZIP'
                  : 'Downloads the same Y.Doc and editor state as the copy actions, as JSON files in one ZIP'}
              </Tooltip>
            </Ariakit.TooltipProvider>
          </Button>
          <Button size="small" onClick={downloadYJSStateAsUpdate}>
            Download YJS State as One Update
            <Ariakit.TooltipProvider>
              <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                <IcInfoCircle />
              </Ariakit.TooltipAnchor>
              <Tooltip>Downloads the current Yjs state as a single update</Tooltip>
            </Ariakit.TooltipProvider>
          </Button>
          <Button size="small" onClick={() => editorController.downloadBaseCommit()}>
            Download Base Commit Updates
            <Ariakit.TooltipProvider>
              <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                <IcInfoCircle />
              </Ariakit.TooltipAnchor>
              <Tooltip>Downloads the updates from the base commit only</Tooltip>
            </Ariakit.TooltipProvider>
          </Button>
          {docController && (
            <>
              <Button size="small" onClick={() => docController.downloadAllUpdatesAsZip()}>
                Download All Updates as ZIP
                <Ariakit.TooltipProvider>
                  <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                    <IcInfoCircle />
                  </Ariakit.TooltipAnchor>
                  <Tooltip>Downloads every update so they can be inspected or replayed</Tooltip>
                </Ariakit.TooltipProvider>
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const yDocJSON = await editorController.getYDocAsJSON()
                  await docController.downloadUpdatesInformation(yDocJSON)
                }}
              >
                Download Update Metadata
                <Ariakit.TooltipProvider>
                  <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                    <IcInfoCircle />
                  </Ariakit.TooltipAnchor>
                  <Tooltip>Downloads information about every update without document content</Tooltip>
                </Ariakit.TooltipProvider>
              </Button>
              <Button size="small" onClick={() => docController.downloadObfuscatedUpdates()}>
                Download Obfuscated Updates
                <Ariakit.TooltipProvider>
                  <Ariakit.TooltipAnchor render={<span className="inline-flex" />}>
                    <IcInfoCircle />
                  </Ariakit.TooltipAnchor>
                  <Tooltip>Downloads updates with sensitive content obfuscated for safer sharing</Tooltip>
                </Ariakit.TooltipProvider>
              </Button>
            </>
          )}

          <Details
            className="rounded border border-[--signal-danger] bg-[--background-norm]"
            data-testid="dangerous-debug-actions"
          >
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

              {docController && (
                <>
                  <Button size="small" color="danger" onClick={commitToRTS}>
                    Commit Document with RTS
                  </Button>
                  <Button size="small" color="danger" onClick={squashDocument}>
                    Squash Last Commit with DX
                  </Button>
                  <Button size="small" color="danger" onClick={createInitialCommit} data-testid="create-initial-commit">
                    Create Initial Commit
                  </Button>
                </>
              )}
              <Button size="small" color="danger" onClick={closeConnection}>
                Close Connection
              </Button>

              {isSpreadsheet && (
                <>
                  <FileInputButton
                    onFileSelect={async (file) => {
                      const spreadsheetState = JSON.parse(await file.text())
                      await editorController.replaceLocalSpreadsheetState(spreadsheetState, false)
                    }}
                  >
                    Apply Spreadsheet State from File
                  </FileInputButton>
                  <Button size="small" color="danger" onClick={() => editorController.removeSpreadsheetPatches()}>
                    Remove Stored Patches
                  </Button>
                  <FileInputButton
                    onFileSelect={async (file) => {
                      const patches = JSON.parse(await file.text())
                      await editorController.applyPatches(patches)
                    }}
                  >
                    Apply Patches from File
                  </FileInputButton>
                </>
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
