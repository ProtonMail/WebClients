import identity from './identity';

describe('identity()', () => {
    it('returns the value as reference', () => {
        const value = {};
        expect(identity(value)).toBe(value);
    });
});
