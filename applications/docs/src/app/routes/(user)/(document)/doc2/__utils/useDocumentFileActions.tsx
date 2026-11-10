import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useNotifications } from '@proton/app-context/useNotifications'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { useMoveItemsModal } from '@proton/drive/public/moveItemsModal'
import type { NodeEntity } from '@proton/drive/sdk'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { c } from 'ttag'

import { useApplication } from '~/utils/application-context'
import { useIsSheetsEnabled } from '~/utils/flags'
import { TrashedDocumentModal } from '../__components/TrashedDocumentModal'
import {
  createSpreadsheet,
  getDriveFolderPath,
  getNewDocumentHref,
  getSpreadsheetHref,
  isInsufficientPermissionsError,
  restoreNode,
  trashNode,
} from './documentFileActions'
import type { DocumentRole } from './getDocumentRole'
import { getNodeName } from './getNodeName'

export type TrashState = 'not_trashed' | 'trashing' | 'trashed' | 'restoring'

export type DocumentFileActions = {
  trashState: TrashState
  isCreatingSpreadsheet: boolean
  /** Opens a new window on doc2, which creates a text document next to this one */
  newDocument: () => void
  /** Creates a spreadsheet next to this document and opens it on legacy sheets in a new window */
  newSpreadsheet: () => void
  moveToFolder: () => void
  /** Admin only */
  moveToTrash: () => void
  /** Opens the document's Drive folder in a new window, or the Drive root when it can't be found */
  openProtonDrive: () => void
  /** The move modal and the trashed modal */
  modals: ReactNode
}

type TrashStatus = {
  state: TrashState
  /** Trashed here rather than elsewhere or before opening, which offers Undo rather than Take out of trash */
  trashedInSession: boolean
}

/**
 * The title menu's Drive actions on the document `node`, as /doc's `DocumentTitleDropdown.tsx` and docs-core's
 * `AuthenticatedDocController` run them. Each does nothing without a node, and trash and restore nothing for a
 * non-Admin. The trash state follows the node, so a document trashed or restored elsewhere shows or leaves the
 * trashed modal.
 */
export function useDocumentFileActions({
  node,
  role,
  driveCompat,
}: {
  node: NodeEntity | undefined
  role: DocumentRole
  driveCompat: DriveCompat
}): DocumentFileActions {
  const { logger } = useApplication()
  const { getLocalID } = useAuthentication()
  const { createNotification } = useNotifications()
  const isSheetsEnabled = useIsSheetsEnabled()
  const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal()

  // A failed trash or restore trusts only a node Drive read while it was in flight: an earlier read can be stale, as
  // after an Undo whose Drive event hasn't come yet
  const latestNodeRef = useRef(node)
  latestNodeRef.current = node
  const [trash, setTrash] = useState<TrashStatus>(() => ({
    state: node?.trashTime ? 'trashed' : 'not_trashed',
    trashedInSession: false,
  }))
  // One trash or restore at a time, also for clicks in the same tick, before the state shows it
  const trashBusyRef = useRef(false)
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false)
  const creatingSpreadsheetRef = useRef(false)

  // Each read of the node from Drive wins, also one that says what the state says already: after an Undo whose Drive
  // event never came, the node still reads trashed, and a later trash elsewhere must show the modal. A trash or
  // restore in flight decides the state when it ends.
  useEffect(() => {
    const trashed = Boolean(node?.trashTime)
    setTrash((trash) =>
      trash.state === 'trashing' || trash.state === 'restoring'
        ? trash
        : { state: trashed ? 'trashed' : 'not_trashed', trashedInSession: trashed && trash.trashedInSession },
    )
  }, [node])

  const newDocument = () => {
    if (!node) {
      return
    }
    getNewWindow(getNewDocumentHref(node, getLocalID()))
  }

  const newSpreadsheet = () => {
    if (!node || !isSheetsEnabled || creatingSpreadsheetRef.current) {
      return
    }
    creatingSpreadsheetRef.current = true
    setIsCreatingSpreadsheet(true)
    // Opened on the click, so no popup blocker stops it after the creation
    const newWindow = getNewWindow()
    createSpreadsheet(node, driveCompat)
      .then(
        (nodeMeta) => newWindow.handle.location.assign(getSpreadsheetHref(nodeMeta, getLocalID())),
        (error) => {
          newWindow.close()
          logger.error('Failed to create a spreadsheet', error)
          createNotification({
            type: 'error',
            text: c('Error').t`An error occurred while creating a new document. Please try again.`,
          })
        },
      )
      .finally(() => {
        creatingSpreadsheetRef.current = false
        setIsCreatingSpreadsheet(false)
      })
  }

  const moveToFolder = () => {
    if (node) {
      showMoveItemsModal({ nodeUids: [node.uid] })
    }
  }

  const moveToTrash = () => {
    if (!node || role !== 'Admin' || trashBusyRef.current || trash.state !== 'not_trashed') {
      return
    }
    trashBusyRef.current = true
    const nodeAtStart = node
    setTrash((trash) => ({ ...trash, state: 'trashing' }))
    trashNode(node.uid)
      .then(
        () => setTrash({ state: 'trashed', trashedInSession: true }),
        (error) => {
          logger.error('Failed to trash the document', error)
          createNotification({
            type: 'error',
            text: c('Error').t`An error occurred while attempting to trash the document. Please try again.`,
          })
          const readDuring = latestNodeRef.current !== nodeAtStart
          setTrash({
            state: readDuring && latestNodeRef.current?.trashTime ? 'trashed' : 'not_trashed',
            trashedInSession: false,
          })
        },
      )
      .finally(() => {
        trashBusyRef.current = false
      })
  }

  const restore = () => {
    if (!node || role !== 'Admin' || trashBusyRef.current || trash.state !== 'trashed') {
      return
    }
    trashBusyRef.current = true
    const nodeAtStart = node
    setTrash((trash) => ({ ...trash, state: 'restoring' }))
    restoreNode(node.uid)
      .then(
        () => setTrash({ state: 'not_trashed', trashedInSession: false }),
        (error) => {
          logger.error('Failed to restore the document', error)
          createNotification({
            type: 'error',
            text: isInsufficientPermissionsError(error)
              ? c('Error').t`Because this document was in a shared folder, only the folder owner can restore it`
              : c('Error').t`An error occurred while attempting to restore the document. Please try again.`,
          })
          const readDuring = latestNodeRef.current !== nodeAtStart
          setTrash((trash) =>
            readDuring && !latestNodeRef.current?.trashTime
              ? { state: 'not_trashed', trashedInSession: false }
              : { ...trash, state: 'trashed' },
          )
        },
      )
      .finally(() => {
        trashBusyRef.current = false
      })
  }

  const openProtonDrive = () => {
    if (!node) {
      return
    }
    // Opened on the click, so no popup blocker stops it after looking up the folder
    const newWindow = getNewWindow()
    getDriveFolderPath(node)
      .catch((error) => {
        logger.warn('Failed to find the Drive folder of the document, opening the Drive root', error)
        return '/'
      })
      .then((path) => newWindow.handle.location.assign(getAppHref(path, APPS.PROTONDRIVE, getLocalID())))
  }

  const goToDrive = () => window.location.assign(getAppHref('/', APPS.PROTONDRIVE, getLocalID()))

  return {
    trashState: trash.state,
    isCreatingSpreadsheet,
    newDocument,
    newSpreadsheet,
    moveToFolder,
    moveToTrash,
    openProtonDrive,
    modals: (
      <>
        {moveItemsModal}
        {node && (
          <TrashedDocumentModal
            documentTitle={getNodeName(node) ?? ''}
            trashState={trash.state}
            trashedInSession={trash.trashedInSession}
            canRestore={role === 'Admin'}
            onRestore={restore}
            onGoToDrive={goToDrive}
          />
        )}
      </>
    ),
  }
}
