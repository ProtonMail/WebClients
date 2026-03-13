import { c } from 'ttag';
import type { Runtime } from 'webextension-polyfill';

import type { Maybe } from '@proton/pass/types';
import { NativeMessageErrorType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export const getMessageForNativeMessageError = (error: NativeMessageErrorType) => {
    switch (error) {
        case NativeMessageErrorType.HOST_NOT_FOUND:
            return c('Error').t`The ${PASS_APP_NAME} desktop app is not installed.`;
        case NativeMessageErrorType.HOST_NOT_RESPONDING:
            return c('Error').t`The ${PASS_APP_NAME} desktop app is not responding, is it running?`;
        case NativeMessageErrorType.NATIVE_MESSAGE_ENCRYPTION_FAILED:
        case NativeMessageErrorType.NATIVE_MESSAGE_DECRYPTION_FAILED:
            return c('Error').t`Encryption communication for desktop unlock failed.`;
        case NativeMessageErrorType.DESKTOP_APP_LOCKED:
            return c('Error').t`The ${PASS_APP_NAME} desktop app is locked, it must be unlocked.`;
        default:
            return c('Error').t`Unknown error`;
    }
};

export class NativeMessageError extends Error {
    constructor(type: NativeMessageErrorType) {
        super(getMessageForNativeMessageError(type));
        this.name = type;
    }
}

export const getForNativeMessageErrorFromConnectionError = (
    port: Maybe<Runtime.PortErrorType>,
    last: Maybe<Runtime.PropertyLastErrorType>
): NativeMessageErrorType => {
    const message = last?.message?.toLowerCase() ?? '';
    if (message.includes('not found')) return NativeMessageErrorType.HOST_NOT_FOUND;
    if (message.includes('exited')) return NativeMessageErrorType.HOST_NOT_RESPONDING;
    log('Unkown connection error', port, last);
    return NativeMessageErrorType.UNKNOWN;
};
