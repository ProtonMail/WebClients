import genericBroadcast, { GenericErrorPayload } from '@proton/shared/lib/broadcast';

export enum MessageType {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    CLOSE = 'CLOSE',
    LOADED = 'LOADED',
    NOTIFICATION = 'NOTIFICATION',
}

type Message =
    | {
          type: MessageType.SUCCESS;
      }
    | {
          type: MessageType.ERROR;
          payload: GenericErrorPayload;
      }
    | {
          type: MessageType.CLOSE;
      }
    | {
          type: MessageType.LOADED;
      }
    | {
          type: MessageType.NOTIFICATION;
          payload: { type: string; text: string };
      };

const broadcast = (message: Message) => genericBroadcast(message);

export default broadcast;
