import * as encoding from 'lib0/encoding'

export function wrapRawYjsMessage(message: Uint8Array, type: number): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, type)
  encoding.writeVarUint8Array(encoder, message)
  return encoding.toUint8Array(encoder)
}
