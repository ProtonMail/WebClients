import { isNotExistError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

describe('isNotExistError', () => {
    it('should be a not exist error', () => {
        // Invalid id
        const error1 = {
            data: {
                Code: 2061,
            },
        };

        // Message does not exists
        const error2 = {
            data: {
                Code: 2501,
            },
        };

        // Conversation does not exists
        const error3 = {
            data: {
                Code: 20052,
            },
        };

        expect(isNotExistError(error1)).toBeTruthy();
        expect(isNotExistError(error2)).toBeTruthy();
        expect(isNotExistError(error3)).toBeTruthy();
    });

    it('should not be a not exist error', () => {
        const error1 = {};

        const error2 = {
            data: {
                Code: 'something else',
            },
        };

        const error3 = {
            data: {},
        };

        expect(isNotExistError(error1)).toBeFalsy();
        expect(isNotExistError(error2)).toBeFalsy();
        expect(isNotExistError(error3)).toBeFalsy();
    });
});
