import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { getCompleteAddress } from '../../../helpers/test/cache';
import { clearAll } from '../../../helpers/test/helper';
import { setup } from './Message.test.helpers';

describe('Message banners', () => {
    afterEach(clearAll);

    it('should show expiration banner', async () => {
        const ExpirationTime = new Date().getTime() / 1000 + 1000;

        await setup({ data: { ExpirationTime } });

        const banner = await screen.findByTestId('expiration-banner');

        expect(banner.textContent).toMatch(/This message will expire/);
    });

    it('should show the decrypted subject banner', async () => {
        const decryptedSubject = 'decrypted-subject';

        await setup({ data: { Subject: '...' }, decryption: { decryptedSubject } });

        const banner = screen.getByTestId('encrypted-subject-banner');

        expect(banner.textContent).toMatch(new RegExp(decryptedSubject));
    });

    it('should show the spam banner', async () => {
        await setup({
            data: {
                Flags: setBit(
                    MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
                    setBit(MESSAGE_FLAGS.FLAG_SENT, setBit(0, MESSAGE_FLAGS.FLAG_RECEIVED))
                ),
            },
        });

        const banner = screen.getByTestId('spam-banner:phishing-banner');

        expect(banner.textContent).toMatch(/phishing/);
    });

    it('should show error banner for network error', async () => {
        await setup({ errors: { network: [new Error('test')] } });

        const banner = screen.getByTestId('errors-banner');

        expect(banner.textContent).toMatch(/error/);
    });

    it('should show the unsubscribe banner with one click method', async () => {
        const toAddress = 'to@domain.com';

        await setup(
            {
                data: {
                    ParsedHeaders: { 'X-Original-To': toAddress },
                    UnsubscribeMethods: { OneClick: 'OneClick' },
                },
            },
            {},
            {
                preloadedState: {
                    addresses: getModelState([getCompleteAddress({ Email: toAddress })]),
                },
            }
        );

        const banner = screen.getByTestId('unsubscribe-banner');

        expect(banner.textContent).toMatch(/Unsubscribe/);
    });

    // it('AUTOPROMPT', async () => {});
    // it('PIN_UNSEEN', async () => {});
    // it('PIN_ATTACHED_SIGNING mode', async () => {});
    // it('PIN_ATTACHED mode', async () => {});
});
