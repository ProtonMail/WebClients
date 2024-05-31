import { AnyCommentMessageData, CommentsMessageType } from '@proton/docs-shared'
import {
  EventTypeEnum,
  ClientMessageWithEvents,
  CreateClientEventMessage,
  ClientEventVersion,
} from '@proton/docs-proto'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'

export function CreateRealtimeCommentMessage<T extends AnyCommentMessageData>(
  type: CommentsMessageType,
  dto: T,
  authorAddress: string,
): ClientMessageWithEvents {
  return CreateClientEventMessage({
    type: EventTypeEnum.ClientHasSentACommentMessage,
    content: stringToUint8Array(
      JSON.stringify({
        type,
        data: dto,
      }),
    ),
    authorAddress,
    timestamp: Date.now(),
    version: ClientEventVersion.V1,
  })
}
