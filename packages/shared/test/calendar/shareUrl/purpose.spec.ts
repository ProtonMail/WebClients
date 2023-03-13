import { CryptoProxy } from '@proton/crypto';
import { MAX_CHARS_CLEARTEXT } from '@proton/shared/lib/calendar/constants';
import { disableRandomMock, initRandomMock } from '@proton/testing/lib/mockRandomValues';

import { generateEncryptedPurpose } from '../../../lib/calendar/sharing/shareUrl/shareUrl';
import { DecryptableKey } from '../../keys/keys.data';

const generateAsciiString = (n: number) => {
    const char = 'a';
    let result = '';

    for (let i = 0; i < n; i++) {
        result += char;
    }

    return result;
};

const generateUcsString = (n: number) => {
    const emoji = '😊';
    let result = '';

    for (let i = 0; i < n; i++) {
        result += emoji;
    }

    return result;
};

describe('getEncryptedPurpose', () => {
    beforeAll(() => initRandomMock());
    afterAll(() => disableRandomMock());

    it('Generates an encrypted purpose within the API bounds', async () => {
        const calendarKey = await CryptoProxy.importPrivateKey({
            armoredKey: DecryptableKey.PrivateKey,
            passphrase: '123',
        });
        const { PURPOSE: maxChars } = MAX_CHARS_CLEARTEXT;

        const purpose = generateUcsString(maxChars / 2);

        // JS uses UTF-16
        expect(purpose.length).toEqual(maxChars);
        // API limit on the encrypted purpose is 2000 characters
        expect((await generateEncryptedPurpose({ purpose, publicKey: calendarKey })).length).toBeLessThan(2000);
        // On ASCII characters we could encode longer strings
        expect(
            (
                await generateEncryptedPurpose({
                    purpose: generateAsciiString(maxChars * 2),
                    publicKey: calendarKey,
                })
            ).length
        ).toBeLessThan(2000);
    });
});
