import { getContactImageSource } from '../../lib/helpers/contacts';
import { mockWindowLocation, resetWindowLocation } from './url.helper';

const uid = 'uid';
const originalURL = 'https://originalURL.com';
const windowOrigin = 'https://mail.proton.pink';

describe('getContactImageSource', () => {
    beforeEach(() => {
        mockWindowLocation({ origin: windowOrigin });
    });

    afterEach(() => {
        resetWindowLocation();
    });

    it('should return the original url of the image', () => {
        const result = getContactImageSource('api', originalURL, uid, false);

        const expected = originalURL;

        expect(result).toEqual(expected);
    });

    it('should return the forged url of the image to load it through Proton proxy', () => {
        const result = getContactImageSource('api', originalURL, uid, true);

        const expected = `${windowOrigin}/api/core/v4/images?Url=${encodeURIComponent(
            originalURL
        )}&DryRun=0&UID=${uid}`;

        expect(result).toEqual(expected);
    });

    it('should load the image from base64', () => {
        const base64 = 'data:image/jpeg;base64, DATA';
        const result = getContactImageSource('api', base64, uid, false);

        const expected = base64;

        expect(result).toEqual(expected);
    });
});
