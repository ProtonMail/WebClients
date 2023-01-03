import { isURL } from '@proton/shared/lib/helpers/validators';

describe('isURL', () => {
    it('should return true for valid URLs', () => {
        const calendarLink =
            'https://calendar.proton.me/api/calendar/v1/url/mGwA0H_CF5I8hNQU-p4FqUxFCFW3AsJE7BxzMzQHe0wmCiT_dyd3G0xl0WUCQmtHSQSfQ4rhACeFIVpsVjO3Kw==/calendar.ics?CacheKey=LRO6Cif1PdTj0Ys-Ox0Idw%3D%3D&PassphraseKey=vNIxDirYWB7r3f6BpgA5JT_flDIFQs0xh0uhImvTcY0%3D';
        const urls = ['https://www.proton.me', 'http://www.proton.me', 'www.proton.me', calendarLink];
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
