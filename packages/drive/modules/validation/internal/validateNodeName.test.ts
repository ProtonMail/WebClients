import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { validateNodeName } from './validateNodeName';

describe('validateNodeName', () => {
    it('returns error if name is empty', () => {
        const result = validateNodeName('');
        expect(result).toMatch(/must not be empty/i);
    });

    it('returns error if name is too long', () => {
        const longName = 'a'.repeat(MAX_NAME_LENGTH + 1);
        const result = validateNodeName(longName);
        expect(result).toMatch(/must be.*long at most/i);
    });

    it('returns error if name contains slash', () => {
        const result = validateNodeName('foo/bar');
        expect(result).toMatch(/must not contain slashes/i);
    });

    it('returns undefined for valid name', () => {
        const result = validateNodeName('valid-name');
        expect(result).toBeUndefined();
    });
});
