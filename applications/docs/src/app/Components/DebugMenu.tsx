import { useEffect, useState } from 'react'
import { Icon } from '@proton/components/components'
import type { DocControllerInterface } from '@proton/docs-core'
import { useApplication } from '../Containers/ApplicationProvider'
import { useLocalState } from '@proton/components/hooks'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'
import { Button } from '@proton/atoms'

export const useDebug = () => {
  const [debug] = useLocalState(false, DOCS_DEBUG_KEY)
  return Boolean(debug)
}

const DebugMenu = ({ docController }: { docController: DocControllerInterface }) => {
  const application = useApplication()

  const [isOpen, setIsOpen] = useState(false)
  const [sharingUrl, setSharingUrl] = useState<string | null>()
  const [clientId, setClientId] = useState<string | null>()

  useEffect(() => {
    void docController.getDocumentClientId().then((id) => {
      setClientId(`${id}`)
    })
  }, [docController])

  const commitToRTS = async () => {
    void docController.debugSendCommitCommandToRTS()
  }

  const squashDocument = async () => {
    void docController.squashDocument()
  }

  const closeConnection = async () => {
    void application.websocketService.closeConnection(docController.getSureDocument())
  }

  const createInitialCommit = async () => {
    void docController.createInitialCommit()
  }

  const copyEditorJSON = async () => {
    const json = await docController.getEditorJSON()
    if (!json) {
      return
    }

    const stringified = JSON.stringify(json)
    void navigator.clipboard.writeText(stringified)
  }

  useEffect(() => {
    if (!docController) {
      return
    }

    void docController.debugGetUnrestrictedSharingUrl().then((url) => {
      setSharingUrl(url)
    })
  }, [docController])

  if (!isOpen) {
    return (
      <button
        id="debug-menu-button"
        className="fixed bottom-2 left-2 z-20 flex items-center justify-center rounded-full border border-[--border-weak] bg-[--background-weak] p-2 hover:bg-[--background-strong]"
        onClick={() => setIsOpen(true)}
      >
        <div className="sr-only">Debug menu</div>
        <Icon name="cog-wheel" className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div
      id="debug-menu"
      className="fixed bottom-2 left-2 z-20 flex min-w-[12.5rem] flex-col gap-2 rounded border border-[--border-weak] bg-[--background-weak] px-1 py-1"
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
        <Button size="small" onClick={createInitialCommit}>
          Create Initial Commit
        </Button>
        <Button size="small" onClick={closeConnection}>
          Close Connection
        </Button>
        <Button size="small" onClick={copyEditorJSON}>
          Copy Editor JSON
        </Button>
        {sharingUrl && (
          <div className="flex flex-col">
            <div>Sharing URL</div>
            <div className="flex gap-1">
              <input
                type="text"
                className="border border-[--border-weak] bg-[--background-norm] px-2 py-1 text-sm"
                value={sharingUrl}
                readOnly
              />
              <button
                className="rounded border border-[--border-weak] bg-[--background-norm] px-2 py-1 text-sm hover:bg-[--background-strong]"
                onClick={() => navigator.clipboard.writeText(sharingUrl)}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DebugMenu
