import type { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import type { EditorControllerInterface } from '../../Controller/Document/EditorController'
import type { PublicDocControllerInterface } from '../../Controller/Document/PublicDocControllerInterface'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'

export type DocLoaderStatusObserver<
  S extends DocumentState | PublicDocumentState,
  D extends DocControllerInterface | PublicDocControllerInterface,
> = {
  onSuccess: (result: {
    orchestrator: EditorOrchestratorInterface
    documentState: S
    docController: D
    editorController: EditorControllerInterface
  }) => void
  onError: (error: string) => void
}
