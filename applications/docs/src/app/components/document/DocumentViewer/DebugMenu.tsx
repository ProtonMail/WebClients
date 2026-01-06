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
        'fixed bottom-2 z-20 flex min-w-[12.5rem] flex-col gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1',
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
        <Button size="small" onClick={() => downloadLogsAsJSON(editorController, documentType)}>
          Download Logs as JSON
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
        <Button size="small" onClick={downloadYJSStateAsUpdate}>
          Download YJS state as single update
        </Button>
        {docController && (
          <Button size="small" onClick={() => docController.downloadAllUpdatesAsZip()}>
            Download All Updates as ZIP
          </Button>
        )}
      </div>
    </div>
  )
}
