import { isTransferCancelError } from './transfer';

describe('trasfer utils', () => {
    describe('isTransferCancelError', () => {
        ['TransferCancel', 'AbortError'].forEach((name) => {
            it(`should return true for error with name ${name}`, () => {
                const error = {
                    name,
                    message: `${name} error accured.`,
                };
                expect(isTransferCancelError(error)).toBeTruthy();
            });
        });

        ['TypeError', 'SyntaxError'].forEach((name) => {
            it(`should return false for error with name ${name}`, () => {
                const error = {
                    name,
                    message: `${name} error accured.`,
                };
                expect(isTransferCancelError(error)).toBeFalsy();
            });
        });
    });
});
