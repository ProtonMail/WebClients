export enum BroadcastSource {
  CommitDocumentUseCase = 'CommitDocumentUseCase',
  CommentsController = 'CommentsController',
  TypingStatusChange = 'TypingStatusChange',
  AwarenessWebSocketOpen = 'AwarenessWebSocketOpen',
  AwarenessUpdateHandler = 'AwarenessUpdateHandler',
  HandleDocBeingUpdatedByLexical = 'HandleDocBeingUpdatedByLexical',
  ExternalCallerRequestingUsToBroadcastOurState = 'ExternalCallerRequestingUsToBroadcastOurState',
  DocumentBufferFlush = 'DocumentBufferFlush',
  RetryingMessagesAfterReconnect = 'RetryingMessagesAfterReconnect',
  AwarenessInterval = 'AwarenessInterval',
  SheetsImport = 'SheetsImport',
}
