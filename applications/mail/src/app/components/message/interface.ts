import type { MessageImage } from 'proton-mail/store/messages/messagesTypes';

export type OnMessageImageLoadError = (image: MessageImage) => Promise<void>;
