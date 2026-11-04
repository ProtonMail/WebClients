import { DocUpdateOrigin } from '@proton/docs-shared/Doc/DocState'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import type { Session } from '@proton-docs/realtime-sdk'

import type { EditorInvoker } from './EditorInvoker'

/** Seeds the editor with the session's base state as a Viewer, which keeps it locked, then shows it. */
export async function showReadOnlyDocument(
  editorInvoker: Pick<EditorInvoker, 'initializeEditor' | 'receiveMessage' | 'showEditor'>,
  session: Pick<Session, 'getBaseState' | 'getNodeMeta'>,
  appVersion: string,
): Promise<void> {
  await editorInvoker.initializeEditor(
    GenerateUUID(),
    session.getNodeMeta().userOwnAddress,
    'Viewer',
    false,
    appVersion,
  )
  // One at a time, so each update gets the invoker's whole timeout rather than sharing it with the rest
  for (const { content } of session.getBaseState().updates) {
    await editorInvoker.receiveMessage({ type: { wrapper: 'du' }, content, origin: DocUpdateOrigin.BaseCommit })
  }
  await editorInvoker.showEditor()
}
