import { getIsUnreachableError, isNotExistError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

describe('isNotExistError', () => {
    it('should be a not exist error', () => {
        const error1 = { data: { Code: 2061 } }; // Invalid id
        const error2 = { data: { Code: 2501 } }; // Message does not exists
        const error3 = { data: { Code: 20052 } }; // Conversation does not exists

        expect(isNotExistError(error1)).toBeTruthy();
        expect(isNotExistError(error2)).toBeTruthy();
        expect(isNotExistError(error3)).toBeTruthy();
    });

    it('should not be a not exist error', () => {
        const error1 = {};
        const error2 = { data: { Code: 'something else' } };
        const error3 = { data: {} };

        expect(isNotExistError(error1)).toBeFalsy();
        expect(isNotExistError(error2)).toBeFalsy();
        expect(isNotExistError(error3)).toBeFalsy();
    });
});

describe('getIsUnreachableError', () => {
    it('should detect 500/503s', () => {
        expect(getIsUnreachableError({ status: 500 })).toBe(true);
        expect(getIsUnreachableError({ status: 503 })).toBe(true);
    });

    it('should consider 502/504s as unreachable error if no response code', () => {
        expect(getIsUnreachableError({ status: 502, data: {} })).toBe(true);
        expect(getIsUnreachableError({ status: 504 })).toBe(true);
    });

    it('should not consider 502/504s as unreachable error if response code present', () => {
        expect(getIsUnreachableError({ status: 502, data: { Code: 1337 } })).toBe(false);
        expect(getIsUnreachableError({ status: 504, data: { Code: 1337 } })).toBe(false);
    });

    it('should consider all other 5xx error codes as unreachable', () => {
        expect(getIsUnreachableError({ status: 501 })).toBe(true);
        expect(getIsUnreachableError({ status: 599 })).toBe(true);
    });

    it('should ignore 505 errors', () => {
        expect(getIsUnreachableError({ status: 505 })).toBe(false);
    });

    it('should ignore non 5xx error codes', () => {
        expect(getIsUnreachableError({ status: 200 })).toBe(false);
        expect(getIsUnreachableError({ status: 203 })).toBe(false);
        expect(getIsUnreachableError({ status: 301 })).toBe(false);
    });
});
