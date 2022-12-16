import { isURL } from '@proton/shared/lib/helpers/validators';

describe('isURL', () => {
    it('should return true for valid URLs', () => {
        const urls = ['https://www.proton.me', 'http://www.proton.me', 'www.proton.me'];
        const results = urls.map((url) => isURL(url));

        expect(results.every((result) => result === true)).toBe(true);
    });

    it('should return false if protocol and www are missing', () => {
        expect(isURL('proton.me')).toBe(false);
    });

    it('should return false if extra text is added to valid urls', () => {
        const urls = [' https://www.proton.me ', 'myURL is http://www.proton.me', 'www.proton.me is my URL'];
        const results = urls.map((url) => isURL(url));

        expect(results.every((result) => result === false)).toBe(true);
    });
});
