import { Button } from '@proton/atoms'
import { Icon, useLocalState } from '@proton/components'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'
import { useEffect, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { AuthenticatedDocControllerInterface, DocumentState, PublicDocumentState } from '@proton/docs-core'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import clsx from '@proton/utils/clsx'

export function useDebug() {
  const [debug] = useLocalState(false, DOCS_DEBUG_KEY)
  return Boolean(debug)
}

export type DebugMenuProps = {
  docController: AuthenticatedDocControllerInterface
  editorController: EditorControllerInterface
  documentState: DocumentState | PublicDocumentState
  documentType: DocumentType
}

export function DebugMenu({ docController, editorController, documentState, documentType }: DebugMenuProps) {
  const application = useApplication()

  const [isOpen, setIsOpen] = useState(false)
  const [clientId, setClientId] = useState<string | null>()

  useEffect(() => {
    void editorController.getDocumentClientId().then((id) => {
      setClientId(`${id}`)
    })
  }, [editorController])

  const commitToRTS = async () => {
    void docController.debugSendCommitCommandToRTS()
  }

  const squashDocument = async () => {
    void docController.squashDocument()
  }

  const closeConnection = async () => {
    const { nodeMeta } = documentState.getProperty('entitlements')
    if (nodeMeta) {
      void application.websocketService.closeConnection(nodeMeta)
    }
  }

  const createInitialCommit = async () => {
    const editorState = await editorController.getDocumentState()
    if (editorState) {
      void docController.createInitialCommit(editorState)
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

  const copySheetsJSON = async () => {
    const json = await editorController.getSheetsJSON()
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

  const isDocument = documentType === 'doc'
  const isSheet = documentType === 'sheet'

  if (!isOpen) {
    return (
      <button
        id="debug-menu-button"
        className={clsx(
          'fixed bottom-2 z-20 flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-2 hover:bg-[--background-strong]',
          isSheet ? 'right-2' : 'left-2',
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
        isSheet ? 'right-2' : 'left-2',
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
        <Button size="small" onClick={commitToRTS}>
          Commit Doc with RTS
        </Button>
        <Button size="small" onClick={squashDocument}>
          Squash Last Commit with DX
        </Button>
        <Button size="small" onClick={createInitialCommit} data-testid="create-initial-commit">
          Create Initial Commit
        </Button>
        <Button size="small" onClick={closeConnection}>
          Close Connection
        </Button>
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
        {isSheet && (
          <>
            <Button size="small" onClick={copySheetsJSON}>
              Copy Sheet State
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
