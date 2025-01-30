import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import type { AuthenticatedDocControllerInterface } from '../../AuthenticatedDocController/AuthenticatedDocControllerInterface'
import type { EditorControllerInterface } from '../../EditorController/EditorController'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { RenameControllerInterface } from '../../RenameController/RenameController'

export type DocLoaderStatusObserver<S extends DocumentState | PublicDocumentState> = {
  onSuccess: (result: {
    orchestrator: EditorOrchestratorInterface
    documentState: S
    docController?: AuthenticatedDocControllerInterface
    editorController: EditorControllerInterface
    renameController: RenameControllerInterface | undefined
  }) => void
  onError: (error: string, code?: DocsApiErrorCode) => void
}
