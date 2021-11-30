import genericBroadcast from '@proton/shared/lib/broadcast';

export enum MessageType {
    NOTIFICATION = 'NOTIFICATION',
    RESIZE = 'RESIZE',
    HUMAN_VERIFICATION_SUCCESS = 'HUMAN_VERIFICATION_SUCCESS',
    CLOSE = 'CLOSE',
    LOADED = 'LOADED',
}

type Message =
    | {
          type: MessageType.NOTIFICATION;
          payload: { type: string; text: string };
      }
    | {
          type: MessageType.RESIZE;
          payload: { height: number };
      }
    | {
          type: MessageType.HUMAN_VERIFICATION_SUCCESS;
          payload: { token: string; type: string };
      }
    | {
          type: MessageType.CLOSE;
      }
    | {
          type: MessageType.LOADED;
      };

const broadcast = (message: Message) => genericBroadcast(message);

export default broadcast;
