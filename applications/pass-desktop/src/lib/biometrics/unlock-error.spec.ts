import { UnlockDeclinedError } from '@proton/pass/utils/errors/errors';

import { PRESENCE_CANCELLED_MESSAGE } from './errors';
import { toUnlockError } from './unlock-error';

describe('toUnlockError', () => {
    test('turns a cancelled check into an `UnlockDeclinedError`', () => {
        expect(() => toUnlockError(new Error(PRESENCE_CANCELLED_MESSAGE))).toThrow(UnlockDeclinedError);
    });

    test('keeps the message of any other failure', () => {
        const run = () => toUnlockError(new Error('There have been too many failed attempts.'));

        expect(run).toThrow(new Error('There have been too many failed attempts.'));
        expect(run).not.toThrow(UnlockDeclinedError);
    });

    test('gives a failure without a message a readable one', () => {
        expect(() => toUnlockError(undefined)).toThrow(new Error('Biometric authentication failed'));
    });
});
