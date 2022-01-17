import genericBroadcast from '@proton/shared/lib/broadcast';

export enum MessageType {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    CLOSE = 'CLOSE',
}

type Message =
    | {
          type: MessageType.SUCCESS;
      }
    | {
          type: MessageType.ERROR;
          payload: { status?: number; code?: number; message?: string; details?: any };
      }
    | {
          type: MessageType.CLOSE;
      };

const broadcast = (message: Message) => genericBroadcast(message);

export default broadcast;
