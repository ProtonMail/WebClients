import { setup } from './ViewEOMessage.test.helpers';
import { EOClearAll } from '../../../../helpers/test/eo/helpers';

describe('Encrypted Outside message banners', () => {
    afterEach(EOClearAll);

    it('should show EO expiration banner', async () => {
        const ExpirationTime = new Date().getTime() / 1000 + 1000;

        const { getByTestId } = await setup({ expirationTime: ExpirationTime });

        const banner = getByTestId('expiration-banner');

        expect(banner.textContent).toMatch(/Expires in less than/);
    });
});
