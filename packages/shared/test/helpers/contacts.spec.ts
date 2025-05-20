import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';

import { getContactImageSource } from '../../lib/helpers/contacts';

const uid = 'uid';
const originalURL = 'https://originalURL.com';
const windowOrigin = 'https://mail.proton.pink';

describe('getContactImageSource', () => {
    it('should return the original url of the image', () => {
        const result = getContactImageSource({
            apiUrl: 'api',
            url: originalURL,
            uid,
            useProxy: false,
            origin: windowOrigin,
        });

        const expected = originalURL;

        expect(result).toEqual(expected);
    });

    it('should return the forged url of the image to load it through Proton proxy', () => {
        const result = getContactImageSource({
            apiUrl: 'api',
            url: originalURL,
            uid,
            useProxy: true,
            origin: windowOrigin,
        });

        const expected = `${windowOrigin}/api/${PROXY_IMG_URL}?Url=${encodeURIComponent(
            originalURL
        )}&DryRun=0&UID=${uid}`;

        expect(result).toEqual(expected);
    });

    it('should load the image from base64', () => {
        const base64 = 'data:image/jpeg;base64, DATA';
        const result = getContactImageSource({
            apiUrl: 'api',
            url: base64,
            uid,
            useProxy: false,
            origin: windowOrigin,
        });

        const expected = base64;

        expect(result).toEqual(expected);
    });
});
