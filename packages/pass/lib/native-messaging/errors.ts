import { c } from 'ttag';
import type { Runtime } from 'webextension-polyfill';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { Maybe } from '../../types';
import { NativeMessageErrorType } from '../../types';
import { logger } from '../../utils/logger';

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
        case NativeMessageErrorType.TOO_MANY_ATTEMPTS:
            return c('Warning').t`Too many attempts`;
        default:
            return c('Error').t`Unknown error.`;
    }
};

export class NativeMessageError extends Error {
    type: NativeMessageErrorType;

    constructor(type: NativeMessageErrorType) {
        super(getMessageForNativeMessageError(type));
        this.name = type;
        this.type = type;
    }
}

export const getForNativeMessageErrorFromConnectionError = (
    port: Maybe<Runtime.PortErrorType>,
    last: Maybe<Runtime.PropertyLastErrorType>
): NativeMessageErrorType => {
    /** Firefox carries the failure on `port.error` while leaving `runtime.lastError` null;
     * Chrome does the opposite. */
    const message = (last?.message ?? port?.message)?.toLowerCase() ?? '';
    if (message.includes('not found')) return NativeMessageErrorType.HOST_NOT_FOUND;
    if (message.includes('exited')) return NativeMessageErrorType.HOST_NOT_RESPONDING;
    /** Firefox does not match the patterns above: an uninstalled desktop app disconnects
     * with "No such native application {name}" (manifest gone) or "Failed to start native
     * messanging host {name}" (manifest present, host binary gone — note the upstream
     * typo, match it verbatim). See IDTEAM-5762. */
    if (message.includes('no such native application')) return NativeMessageErrorType.HOST_NOT_FOUND;
    if (message.includes('messanging')) return NativeMessageErrorType.HOST_NOT_RESPONDING;
    /** Firefox gives no structured error to the extension: when the manifest is present but the
     * host binary is missing or fails to spawn, `port.error` is the generic "An unexpected error
     * occurred" with an empty stack and no result code (the real cause is only visible in the
     * Browser Console). A fresh `connectNative` can only reach this state when the host cannot
     * launch, i.e. the desktop app is effectively absent — map it to HOST_NOT_FOUND. See
     * IDTEAM-5762. */
    if (message.includes('unexpected error')) return NativeMessageErrorType.HOST_NOT_FOUND;
    log('Unkown connection error', last?.message ?? port?.message);
    return NativeMessageErrorType.UNKNOWN;
};

export const getNativeMessageErrorType = (err: unknown): NativeMessageErrorType | null =>
    err instanceof NativeMessageError ? err.type : null;

export type NativeMessageErrorKind = 'auth' | 'infra';

const getErrorTypeKind = (type: NativeMessageErrorType): NativeMessageErrorKind => {
    switch (type) {
        case NativeMessageErrorType.BIOMETRICS_FAILED:
        case NativeMessageErrorType.SECRET_NOT_FOUND:
        case NativeMessageErrorType.SECRET_MISMATCH:
        case NativeMessageErrorType.TOO_MANY_ATTEMPTS:
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
