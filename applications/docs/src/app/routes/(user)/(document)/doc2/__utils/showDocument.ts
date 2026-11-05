import { DocUpdateOrigin } from '@proton/docs-shared/Doc/DocState'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import type { Session } from '@proton-docs/realtime-sdk'

import type { EditorInvoker } from './EditorInvoker'
import type { DocumentRole } from './getDocumentRole'

/** Sends the session's base state to the editor, which holds the updates it gets until it is initialized. */
export async function sendBaseState(
  editorInvoker: Pick<EditorInvoker, 'receiveMessage'>,
  session: Pick<Session, 'getBaseState'>,
): Promise<void> {
  // One at a time, so each update gets the invoker's whole timeout rather than sharing it with the rest
  for (const { content } of session.getBaseState().updates) {
    await editorInvoker.receiveMessage({ type: { wrapper: 'du' }, content, origin: DocUpdateOrigin.BaseCommit })
  }
}

/**
 * Initializes the editor for the user's role with the updates it holds, then shows it, still locked. A viewer's
 * read-only preview copies the editor's content as it initializes and throws on an empty one (Lexical #38), so call
 * this only once the editor holds the whole document.
 */
export async function showDocument(
  editorInvoker: Pick<EditorInvoker, 'initializeEditor' | 'showEditor'>,
  session: Pick<Session, 'getNodeMeta'>,
  role: DocumentRole,
  appVersion: string,
): Promise<void> {
  await editorInvoker.initializeEditor(GenerateUUID(), session.getNodeMeta().userOwnAddress, role, false, appVersion)
  await editorInvoker.showEditor()
}
