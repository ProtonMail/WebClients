export enum DocControllerEvent {
  RealtimeCommentMessageReceived = 'RealtimeCommentMessageReceived',
  SquashVerificationObjectionDecisionRequired = 'SquashVerificationObjectionDecisionRequired',
  UnableToResolveCommitIdConflict = 'UnableToResolveCommitIdConflict',
  DidLoadInitialEditorContent = 'DidLoadInitialEditorContent',
  DidLoadDocumentTitle = 'DidLoadDocumentTitle',
  DocumentTrashStateUpdated = 'DocumentTrashStateUpdated',
}

export type DocControllerEventPayloads = {
  [DocControllerEvent.RealtimeCommentMessageReceived]: {
    message: Uint8Array
  }
  [DocControllerEvent.SquashVerificationObjectionDecisionRequired]: {}
  [DocControllerEvent.UnableToResolveCommitIdConflict]: {}
  [DocControllerEvent.DidLoadInitialEditorContent]: {}
  [DocControllerEvent.DidLoadDocumentTitle]: { title: string }
  [DocControllerEvent.DocumentTrashStateUpdated]: undefined
}
