import type { IFrameMessageWithSender } from 'proton-pass-extension/app/content/types';

import { isObject } from '@proton/pass/utils/object/is-object';

export const isIFrameMessage = (message: unknown): message is IFrameMessageWithSender =>
    isObject(message) && 'type' in message && typeof message.type === 'string';
