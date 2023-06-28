import { screen, waitFor } from '@testing-library/react';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOClearAll } from '../../../../helpers/test/eo/helpers';
import { setup } from './ViewEOMessage.test.helpers';

describe('Encrypted Outside message banners', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should show EO expiration banner', async () => {
        const ExpirationTime = new Date().getTime() / 1000 + 1000;

        await setup({ expirationTime: ExpirationTime });

        const banner = await waitFor(() => screen.findByTestId('expiration-banner'));

        expect(banner.textContent).toMatch(/Expires in/);
    });
});
