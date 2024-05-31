export enum YjsOperationType {
  SyncStep1 = 'SyncStep1',
  SyncStep2 = 'SyncStep2',
  DocumentUpdate = 'DocumentUpdate',
  Awareness = 'Awareness',
  Unknown = 'Unknown',
}

/** https://github.com/yjs/y-protocols/blob/master/PROTOCOL.md#handling-read-only-users */
export function GetYjsOperationType(buf: ArrayBuffer): YjsOperationType {
  const byteArray = new Uint8Array(buf)
  const firstByte = byteArray[0]
  const secondByte = byteArray[1]

  if (firstByte === 0) {
    if (secondByte === 0) {
      return YjsOperationType.SyncStep1
    }
    if (secondByte === 1) {
      return YjsOperationType.SyncStep2
    }
    if (secondByte === 2) {
      return YjsOperationType.DocumentUpdate
    }
  } else if (firstByte === 1) {
    return YjsOperationType.Awareness
  }

  return YjsOperationType.Unknown
}
