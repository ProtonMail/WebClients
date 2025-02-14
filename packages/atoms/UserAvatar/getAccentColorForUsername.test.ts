import { ACCENT_COLORS_IN_HSL, getAccentColorForUsername } from './getAccentColorForUsername';

describe('GetAccentColorForUsername', () => {
    it('should deterministically return a color for a given username', () => {
        expect(getAccentColorForUsername('foo')).toBe(ACCENT_COLORS_IN_HSL[4]);

        expect(getAccentColorForUsername('bar')).toBe(ACCENT_COLORS_IN_HSL[9]);

        expect(getAccentColorForUsername('baz')).toBe(ACCENT_COLORS_IN_HSL[17]);
        expect(getAccentColorForUsername('baz')).toBe(ACCENT_COLORS_IN_HSL[17]);
    });
});
