import { Button } from '@proton/atoms/Button/Button'
import { Icon } from '@proton/components'
import { useEffect, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import { downloadLogsAsJSON } from '~/utils/downloadLogs'
import type {
  EditorControllerInterface,
  AuthenticatedDocControllerInterface,
  DocumentState,
  PublicDocumentState,
} from '@proton/docs-core'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import clsx from '@proton/utils/clsx'
import { ConnectionCloseReason } from '@proton/docs-proto'
import { isDevOrBlack } from '@proton/docs-shared'
import {
  decompressDocumentUpdate,
  isCompressedDocumentUpdate,
} from '@proton/docs-core/lib/utils/document-update-compression'
import { Tooltip } from '@proton/docs-shared/components/ui/ui'
import * as Ariakit from '@ariakit/react'

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

  const downloadBaseCommit = async () => {
    const baseCommit = documentState.getProperty('baseCommit')
    if (!baseCommit) {
      return
    }
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const message of baseCommit.messages) {
      const content = message.content
      if (isCompressedDocumentUpdate(content)) {
        const decompressed = decompressDocumentUpdate(content)
        zip.file(`${message.timestamp}.bin`, decompressed)
      } else {
        zip.file(`${message.timestamp}.bin`, content)
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipUrl = URL.createObjectURL(zipBlob)
    const zipLink = document.createElement('a')
    zipLink.href = zipUrl
    zipLink.download = 'all-updates-in-base-commit.zip'
    document.body.appendChild(zipLink)
    zipLink.click()
    document.body.removeChild(zipLink)
    URL.revokeObjectURL(zipUrl)
  }

  const isDocument = documentType === 'doc'
  const isSpreadsheet = documentType === 'sheet'

  const [updatesToApply, setUpdatesToApply] = useState<Uint8Array<ArrayBuffer>[]>([])
  const [appliedUpdates, setAppliedUpdates] = useState(0)
  const [applyMultiple, setApplyMultiple] = useState(1)

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
        <Icon name="cog-wheel" className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div
      id="debug-menu"
      className={clsx(
        'fixed bottom-2 z-20 flex min-w-[12.5rem] flex-col gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1 [&_button]:flex [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:text-left',
        isSpreadsheet ? 'right-2' : 'left-2',
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
          <Icon name="cross" className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mb-1 flex flex-col gap-2 px-1">
        {docController && (
          <>
            <div>ClientID: {clientId}</div>
          </>
        )}
        {isDevOrBlack() && (
          <>
            {docController && (
              <>
                <Button size="small" onClick={commitToRTS}>
                  Commit Doc with RTS
                </Button>
                <Button size="small" onClick={squashDocument}>
                  Squash Last Commit with DX
                </Button>
                <Button size="small" onClick={createInitialCommit} data-testid="create-initial-commit">
                  Create Initial Commit
                </Button>
              </>
            )}
            <Button size="small" onClick={closeConnection}>
              Close Connection
            </Button>
          </>
        )}
        <Button size="small" onClick={copyYDocAsJSON}>
          Copy Y.Doc as JSON
        </Button>
        {isDocument && (
          <>
            <Button size="small" onClick={copyEditorJSON}>
              Copy Editor JSON
            </Button>
            <Button size="small" onClick={toggleDebugTreeView}>
              Toggle Tree View
            </Button>
          </>
        )}
        {isSpreadsheet && (
          <>
            <Button size="small" onClick={copyLatestSpreadsheetStateToLogJSON}>
              Copy Spreadsheet State
            </Button>
          </>
        )}
        <Button size="small" onClick={() => downloadLogsAsJSON(editorController, documentType)}>
          Download state as JSON
          <Ariakit.TooltipProvider>
            <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
            <Tooltip>Downloads the current Yjs and local state of the document as JSON</Tooltip>
          </Ariakit.TooltipProvider>
        </Button>
        <Button size="small" onClick={downloadYJSStateAsUpdate}>
          Download YJS state as single update
          <Ariakit.TooltipProvider>
            <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
            <Tooltip>Downloads the current Yjs state as a single update</Tooltip>
          </Ariakit.TooltipProvider>
        </Button>
        <Button size="small" onClick={downloadBaseCommit}>
          Download base commit updates
          <Ariakit.TooltipProvider>
            <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
            <Tooltip>Downloads the updates from the base commit only</Tooltip>
          </Ariakit.TooltipProvider>
        </Button>
        {docController && (
          <>
            <Button size="small" onClick={() => docController.downloadAllUpdatesAsZip()}>
              Download all updates as ZIP
              <Ariakit.TooltipProvider>
                <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
                <Tooltip>Downloads all updates as a ZIP file</Tooltip>
              </Ariakit.TooltipProvider>
            </Button>
            <Button size="small" onClick={() => docController.downloadUpdatesInformation()}>
              Download update debug information
              <Ariakit.TooltipProvider>
                <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
                <Tooltip>Downloads debug information about all updates, does not include the content</Tooltip>
              </Ariakit.TooltipProvider>
            </Button>
            <Button size="small" onClick={() => docController.downloadObfuscatedUpdates()}>
              Download obfuscated updates
              <Ariakit.TooltipProvider>
                <Ariakit.TooltipAnchor render={<Icon name="info-circle" />} />
                <Tooltip>
                  Downloads all updates obfuscated so that they can be used for debugging without revealing sensitive
                  data
                </Tooltip>
              </Ariakit.TooltipProvider>
            </Button>
          </>
        )}
        <details className="border-weak rounded border">
          <summary className="bg-norm border-weak flex items-center justify-between rounded border px-3 py-1">
            Apply updates (ephemeral)
            <Icon name="chevron-down" />
          </summary>
          <div className="flex flex-col gap-2 p-2">
            <label>
              <div className="mb-1.5 text-sm leading-none">Updates to apply:</div>
              <input
                type="file"
                accept="application/zip"
                onChange={async (event) => {
                  if (!event.target.files) {
                    return
                  }
                  const file = event.target.files[0]
                  if (!file) {
                    return
                  }
                  const JSZip = (await import('jszip')).default
                  const zip = new JSZip()
                  const content = await zip.loadAsync(file)
                  const filenames = Object.keys(content.files)
                  filenames.sort((a, b) => parseInt(a) - parseInt(b))
                  const updates: Uint8Array<ArrayBuffer>[] = []
                  for (const filename of filenames) {
                    const file = content.files[filename]
                    if (!file) {
                      continue
                    }
                    const update = await file.async('uint8array')
                    updates.push(update as Uint8Array<ArrayBuffer>)
                  }
                  setUpdatesToApply(updates)
                }}
                disabled={updatesToApply.length > 0}
              />
            </label>
            <div>
              Applied: {appliedUpdates} / {updatesToApply.length}
            </div>
            <label>
              <div className="mb-1.5 text-sm leading-none">Apply mulitple:</div>
              <input
                className="bg-norm"
                id="ephemeral-updates-apply-multiple-input"
                type="number"
                min={1}
                value={applyMultiple}
                onChange={(event) => setApplyMultiple(parseInt(event.target.value))}
                disabled={updatesToApply.length === 0}
              />
            </label>
            <Button
              size="small"
              onClick={() => {
                for (let i = 0; i < applyMultiple; i++) {
                  const update = updatesToApply[appliedUpdates + i]
                  if (!update) {
                    continue
                  }
                  void editorController.applyUpdate(update)
                }
                setAppliedUpdates(appliedUpdates + applyMultiple)
              }}
              disabled={updatesToApply.length === 0}
            >
              Apply {applyMultiple} updates
            </Button>
            <Button
              size="small"
              onClick={() => {
                const update = updatesToApply[appliedUpdates]
                if (!update) {
                  return
                }
                void editorController.applyUpdate(update)
                setAppliedUpdates(appliedUpdates + 1)
              }}
              disabled={updatesToApply.length === 0}
            >
              Apply next update
            </Button>
          </div>
        </details>
      </div>
    </div>
  )
}
