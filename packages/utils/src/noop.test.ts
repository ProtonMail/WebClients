import noop from './noop';

describe('noop()', () => {
    it('returns undefined', () => {
        expect(noop()).toBe(undefined);
    });
});
