import { findByText, waitFor } from '@testing-library/dom';
import { setup } from './ViewEOMessage.test.helpers';
import { getIframeRootDiv } from '../../../message/tests/Message.test.helpers';
import { EOBody, EOClearAll, EOSubject } from '../../../../helpers/test/eo/helpers';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';

describe('Encrypted Outside message view encryption', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should decrypt and render a EO message', async () => {
        const { getByText, container } = await setup();

        await waitFor(() => getByText(EOSubject));

        const iframeContent = await getIframeRootDiv(container);

        await findByText(iframeContent, EOBody);
    });
});
