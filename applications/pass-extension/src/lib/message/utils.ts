import type { WorkerMessage, WorkerMessageType, WorkerMessageWithSender } from 'proton-pass-extension/types/messages';

import type { ClientEndpoint } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

export const isExtensionMessage = (message: unknown): message is WorkerMessageWithSender =>
    isObject(message) && 'type' in message && typeof message.type === 'string';

export const matchExtensionMessage = <T extends WorkerMessageType>(
    message: unknown,
    options: { type?: T; sender?: ClientEndpoint }
): message is WorkerMessageWithSender<Extract<WorkerMessage, { type: T }>> =>
    isExtensionMessage(message) &&
    (!options.type || options.type === message.type) &&
    (!options.sender || options.sender === message.sender);
