import { NativeMessageErrorType } from '../../types';
import {
    NativeMessageError,
    getForNativeMessageErrorFromConnectionError,
    getNativeMessageErrorKind,
    getNativeMessageErrorType,
} from './errors';

describe('native-messaging errors', () => {
    describe('getNativeMessageErrorType', () => {
        test('reads the type off a NativeMessageError', () => {
            const error = new NativeMessageError(NativeMessageErrorType.SECRET_MISMATCH);
            expect(getNativeMessageErrorType(error)).toBe(NativeMessageErrorType.SECRET_MISMATCH);
        });

        test('relies on the type field, not the localized message (locale-independent)', () => {
            const error = new NativeMessageError(NativeMessageErrorType.BIOMETRICS_FAILED);
            /** Simulate a different/edited locale: the message no longer matches the table. */
            error.message = 'un message complètement différent';
            expect(getNativeMessageErrorType(error)).toBe(NativeMessageErrorType.BIOMETRICS_FAILED);
        });

        test('returns null for a plain Error', () => {
            expect(getNativeMessageErrorType(new Error('boom'))).toBeNull();
        });

        test('returns null for non-error values', () => {
            expect(getNativeMessageErrorType(null)).toBeNull();
            expect(getNativeMessageErrorType(undefined)).toBeNull();
            expect(getNativeMessageErrorType('SECRET_MISMATCH')).toBeNull();
        });
    });

    describe('getForNativeMessageErrorFromConnectionError', () => {
        const portError = (message: string) => ({ message });

        test.each([
            ['Specified native messaging host not found.', NativeMessageErrorType.HOST_NOT_FOUND],
            ['No such native application me.proton.pass.nm', NativeMessageErrorType.HOST_NOT_FOUND],
            ['Native host has exited.', NativeMessageErrorType.HOST_NOT_RESPONDING],
            ['Failed to start native messanging host me.proton.pass.nm.', NativeMessageErrorType.HOST_NOT_RESPONDING],
            // Firefox generic failure when the host cannot be spawned (see errors.ts)
            ['An unexpected error occurred', NativeMessageErrorType.HOST_NOT_FOUND],
        ])('maps lastError "%s" to %s', (reason, expected) => {
            expect(getForNativeMessageErrorFromConnectionError(undefined, { message: reason })).toBe(expected);
        });

        test.each([
            ['Specified native messaging host not found.', NativeMessageErrorType.HOST_NOT_FOUND],
            ['No such native application me.proton.pass.nm', NativeMessageErrorType.HOST_NOT_FOUND],
            ['Native host has exited.', NativeMessageErrorType.HOST_NOT_RESPONDING],
            ['An unexpected error occurred', NativeMessageErrorType.HOST_NOT_FOUND],
        ])('maps port.error "%s" to %s', (reason, expected) => {
            expect(getForNativeMessageErrorFromConnectionError(portError(reason), undefined)).toBe(expected);
        });

        test('maps an unavailable reason to UNKNOWN', () => {
            expect(getForNativeMessageErrorFromConnectionError(undefined, undefined)).toBe(
                NativeMessageErrorType.UNKNOWN
            );
            expect(getForNativeMessageErrorFromConnectionError(undefined, { message: 'something else' })).toBe(
                NativeMessageErrorType.UNKNOWN
            );
        });
    });

    describe('getNativeMessageErrorKind', () => {
        test.each([
            NativeMessageErrorType.BIOMETRICS_FAILED,
            NativeMessageErrorType.SECRET_NOT_FOUND,
            NativeMessageErrorType.SECRET_MISMATCH,
            NativeMessageErrorType.TOO_MANY_ATTEMPTS,
        ])('classifies %s as auth', (type) => {
            expect(getNativeMessageErrorKind(new NativeMessageError(type))).toBe('auth');
        });

        test.each([
            NativeMessageErrorType.TIMEOUT,
            NativeMessageErrorType.HOST_NOT_FOUND,
            NativeMessageErrorType.ACCOUNT_MISMATCH,
            NativeMessageErrorType.UNKNOWN,
        ])('classifies %s as infra', (type) => {
            expect(getNativeMessageErrorKind(new NativeMessageError(type))).toBe('infra');
        });

        test('returns null for a non-NativeMessageError', () => {
            expect(getNativeMessageErrorKind(new Error('boom'))).toBeNull();
        });
    });
});
