import type { SafeErrorObject } from '@proton/utils/getSafeErrorObject';
import { getSafeErrorObject } from '@proton/utils/getSafeErrorObject';

import supportedPreviews from './previews';

export type OutgoingMessage = OutgoingErrorMessage;

export const postMessage = (message: OutgoingMessage) => {
    window.parent.postMessage(message, window.location.origin);
};

type OutgoingErrorMessage = {
    type: 'error';
    error: SafeErrorObject;
};

export const postError = (error: Error) => {
    // In case the client stops receiving messages for whatever reason,
    // we trace it here so we can know it happened

    // eslint-disable-next-line no-console
    console.error(error);

    postMessage({
        type: 'error',
        error: getSafeErrorObject(error),
    });
};

type IncomingDataMessage = {
    type: 'data';
    mimeType: string;
    data: Uint8Array<ArrayBuffer>;
};

const handleData = async (message: IncomingDataMessage) => {
    const preview = supportedPreviews[message.mimeType];

    try {
        if (preview) {
            await preview(message.data);
        } else {
            throw new Error(`Unsupported sandboxed preview mimetype: ${message.mimeType}`);
        }
    } catch (e) {
        postError(e as Error);
    }
};

export type IncomingMessage = IncomingDataMessage;

export const handleMessage = (message: IncomingMessage) => {
    if (message.type === 'data') {
        void handleData(message);
    } else {
        postError(new Error(`Unexpected message type: ${message.type}`));
    }
};
