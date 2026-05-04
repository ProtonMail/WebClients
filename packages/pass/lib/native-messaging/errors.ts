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
            return c('Error').t`Encrypted communication with ${PASS_APP_NAME} desktop app failed.`;
        case NativeMessageErrorType.DESKTOP_APP_LOCKED:
            return c('Error').t`The ${PASS_APP_NAME} desktop app is locked, it must be unlocked.`;
        case NativeMessageErrorType.TIMEOUT:
            return c('Error').t`The ${PASS_APP_NAME} desktop app did not respond in time.`;
        case NativeMessageErrorType.SETUP_LOCK_SECRET_INVALID_RESPONSE:
            return c('Error').t`Biometric lock setup failed.`;
        case NativeMessageErrorType.SECRET_NOT_FOUND:
            return c('Error').t`Biometric lock credentials not found.`;
        case NativeMessageErrorType.BIOMETRICS_FAILED:
            return c('Error').t`Biometric authentication failed.`;
        case NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED:
            return c('Error').t`Biometric lock is not configured.`;
        case NativeMessageErrorType.SECRET_MISMATCH:
            return c('Error').t`Biometric lock credentials do not match.`;
        case NativeMessageErrorType.ACCOUNT_MISMATCH:
            return c('Error').t`The ${PASS_APP_NAME} desktop app is signed in with a different account.`;
        case NativeMessageErrorType.DESKTOP_APP_NOT_LOGGED_IN:
            return c('Error').t`The ${PASS_APP_NAME} desktop app should be logged in.`;
        case NativeMessageErrorType.UNLOCK_IN_PROGRESS:
            return c('Error').t`A desktop unlock check is already in progress.`;
        default:
            return c('Error').t`Unknown error.`;
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

export const getNativeMessageErrorType = (err: unknown): NativeMessageErrorType | null => {
    if (!err || typeof err !== 'object' || !('message' in err)) return null;
    const { message } = err as { message: unknown };
    return (
        Object.values(NativeMessageErrorType).find((type) => message === getMessageForNativeMessageError(type)) ?? null
    );
};

export const isErrorOfType = (err: unknown, type: NativeMessageErrorType) => getNativeMessageErrorType(err) === type;

export type NativeMessageErrorKind = 'auth' | 'infra';

const getErrorTypeKind = (type: NativeMessageErrorType): NativeMessageErrorKind => {
    switch (type) {
        case NativeMessageErrorType.BIOMETRICS_FAILED:
        case NativeMessageErrorType.SECRET_NOT_FOUND:
        case NativeMessageErrorType.SECRET_MISMATCH:
            return 'auth';
        case NativeMessageErrorType.HOST_NOT_FOUND:
        case NativeMessageErrorType.HOST_NOT_RESPONDING:
        case NativeMessageErrorType.DESKTOP_APP_LOCKED:
        case NativeMessageErrorType.TIMEOUT:
        case NativeMessageErrorType.NATIVE_MESSAGE_ENCRYPTION_FAILED:
        case NativeMessageErrorType.NATIVE_MESSAGE_DECRYPTION_FAILED:
        case NativeMessageErrorType.UNKNOWN:
        case NativeMessageErrorType.SETUP_LOCK_SECRET_INVALID_RESPONSE:
        case NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED:
        case NativeMessageErrorType.ACCOUNT_MISMATCH:
        case NativeMessageErrorType.DESKTOP_APP_NOT_LOGGED_IN:
        case NativeMessageErrorType.UNLOCK_IN_PROGRESS:
            return 'infra';
    }
};

export const getNativeMessageErrorKind = (err: unknown): NativeMessageErrorKind | null => {
    const type = getNativeMessageErrorType(err);
    return type !== null ? getErrorTypeKind(type) : null;
};
