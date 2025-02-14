import { getAccentColorForUsername } from './getAccentColorForUsername';
import { UserAvatarHueCache, getHue } from './getHue';

jest.mock('./getAccentColorForUsername');

const mockedGetAccentColorForUsername = jest
    .mocked(getAccentColorForUsername)
    .mockImplementation(jest.requireActual('./getAccentColorForUsername').getAccentColorForUsername);

describe('getHue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the Hue cache before each test
        UserAvatarHueCache.clear();
    });

    it('should return hue from color.hsl when valid', () => {
        const result = getHue('bob@proton.me', { hsl: 'hsl(120, 50%, 50%)' });
        expect(result).toBe(120);
    });

    it('should return hue from color.hue when valid', () => {
        const result = getHue('bob@proton.me', { hue: 180 });
        expect(result).toBe(180);
    });

    it('should return cached hue if available', () => {
        const name = 'Bob D.';

        getHue(name);
        const result = getHue(name);

        expect(result).toBe(302);
        expect(mockedGetAccentColorForUsername).toHaveBeenCalledTimes(1);
    });

    it('should calculate and cache new hue if not cached', () => {
        const name = 'John D.';
        const name2 = 'Bob D.';

        const result = getHue(name);
        const result2 = getHue(name2);

        expect(result).toBe(240);
        expect(result2).toBe(302);
        expect(mockedGetAccentColorForUsername).toHaveBeenCalledWith(name);
        expect(mockedGetAccentColorForUsername).toHaveBeenCalledWith(name2);
        expect(mockedGetAccentColorForUsername).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid hsl string', () => {
        const result = getHue('John D.', { hsl: 'invalid-hsl' });

        expect(result).toBe(240);
    });

    it('should handle invalid hue value', () => {
        const result = getHue('John D.', { hue: NaN });

        expect(result).toBe(240);
    });
});
