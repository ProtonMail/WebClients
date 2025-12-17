import type { AnyCommentMessageData, CommentsMessageType } from '@proton/docs-shared'
import { utf8StringToUint8Array } from '@proton/crypto/lib/utils'

export function CreateRealtimeCommentPayload<T extends AnyCommentMessageData>(
  type: CommentsMessageType,
  dto: T,
): Uint8Array<ArrayBuffer> {
  return utf8StringToUint8Array(
    JSON.stringify({
      type,
      data: dto,
    }),
  )
}
