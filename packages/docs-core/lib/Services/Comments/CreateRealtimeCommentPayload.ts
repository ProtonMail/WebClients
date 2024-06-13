import { AnyCommentMessageData, CommentsMessageType } from '@proton/docs-shared'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'

export function CreateRealtimeCommentPayload<T extends AnyCommentMessageData>(
  type: CommentsMessageType,
  dto: T,
): Uint8Array {
  return stringToUint8Array(
    JSON.stringify({
      type,
      data: dto,
    }),
  )
}
