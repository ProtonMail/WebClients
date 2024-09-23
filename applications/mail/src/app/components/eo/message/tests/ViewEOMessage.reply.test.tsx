import { screen } from '@testing-library/react';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOClearAll, reply } from '../../../../helpers/test/eo/helpers';
import type { EOMessageReply } from '../../../../store/eo/eoType';
import { setup } from './ViewEOMessage.test.helpers';

describe('Encrypted Outside message reply', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should not be able to click on reply button if max replies has been reached', async () => {
        await setup({ replies: [reply, reply, reply, reply, reply] as EOMessageReply[] });

        const replyButton = await screen.findByTestId('eoreply:button');
        expect(replyButton).toHaveAttribute('disabled');
    });

    it('should be able to click on reply button if max replies has not been reached', async () => {
        await setup({ replies: [reply, reply, reply, reply] as EOMessageReply[] });

        const replyButton = await screen.findByTestId('eoreply:button');
        expect(replyButton).not.toHaveAttribute('disabled');
    });
});
