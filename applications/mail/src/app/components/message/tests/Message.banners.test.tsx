import { waitFor } from '@testing-library/react';

import { setBit } from '@proton/shared/lib/helpers/bitset';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { addAddressToCache, minimalCache } from '../../../helpers/test/cache';
import { clearAll } from '../../../helpers/test/helper';
import { initMessage, setup } from './Message.test.helpers';

describe('Message banners', () => {
    afterEach(clearAll);

    it('should show expiration banner', async () => {
        const ExpirationTime = new Date().getTime() / 1000 + 1000;

        initMessage({ data: { ExpirationTime } });

        const { getByTestId } = await setup();

        const banner = await waitFor(() => getByTestId('expiration-banner'));

        expect(banner.textContent).toMatch(/This message will expire/);
    });

    it('should show the decrypted subject banner', async () => {
        const decryptedSubject = 'decrypted-subject';

        initMessage({ data: { Subject: '...' }, decryption: { decryptedSubject } });

        const { getByTestId } = await setup();

        const banner = getByTestId('encrypted-subject-banner');

        expect(banner.textContent).toMatch(new RegExp(decryptedSubject));
    });

    it('should show the spam banner', async () => {
        initMessage({
            data: {
                Flags: setBit(
                    MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
                    setBit(MESSAGE_FLAGS.FLAG_SENT, setBit(0, MESSAGE_FLAGS.FLAG_RECEIVED))
                ),
            },
        });

        const { getByTestId } = await setup();

        const banner = getByTestId('spam-banner:phishing-banner');

        expect(banner.textContent).toMatch(/phishing/);
    });

    it('should show error banner for network error', async () => {
        initMessage({ errors: { network: [new Error('test')] } });

        const { getByTestId } = await setup();

        const banner = getByTestId('errors-banner');

        expect(banner.textContent).toMatch(/error/);
    });

    it('should show the unsubscribe banner with one click method', async () => {
        const toAddress = 'to@domain.com';

        minimalCache();
        addAddressToCache({ Email: toAddress });
        initMessage({
            data: {
                ParsedHeaders: { 'X-Original-To': toAddress },
                UnsubscribeMethods: { OneClick: 'OneClick' },
            },
        });

        const { getByTestId } = await setup({}, false);

        const banner = getByTestId('unsubscribe-banner');

        expect(banner.textContent).toMatch(/Unsubscribe/);
    });

    // it('AUTOPROMPT', async () => {});
    // it('PIN_UNSEEN', async () => {});
    // it('PIN_ATTACHED_SIGNING mode', async () => {});
    // it('PIN_ATTACHED mode', async () => {});
});
