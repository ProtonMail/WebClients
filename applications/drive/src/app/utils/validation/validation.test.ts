import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { validateLinkName } from './validation';

describe('validateLinkName', () => {
    it('returns error if name is empty', () => {
        const result = validateLinkName('');
        expect(result).toMatch(/must not be empty/i);
    });

    it('returns error if name is too long', () => {
        const longName = 'a'.repeat(MAX_NAME_LENGTH + 1);
        const result = validateLinkName(longName);
        expect(result).toMatch(/must be.*long at most/i);
    });

    it('returns error if name contains slash', () => {
        const result = validateLinkName('foo/bar');
        expect(result).toMatch(/must not contain slashes/i);
    });

    it('returns undefined for valid name', () => {
        const result = validateLinkName('valid-name');
        expect(result).toBeUndefined();
    });
});
