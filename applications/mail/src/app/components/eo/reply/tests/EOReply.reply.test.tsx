import { waitFor } from '@testing-library/react';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { EOClearAll, reply } from '../../../../helpers/test/eo/helpers';
import { setup } from './EOReply.test.helpers';

describe('EO Reply if max replies has been reached', function () {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should have the sending button disabled if max replies has been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply, reply, reply] });

        const sendButton = await waitFor(() => getByTestId('send-eo'));

        expect(sendButton).toHaveAttribute('disabled');
    });

    it('should have the sending button enabled if max replies has not been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply] });

        const sendButton = await waitFor(() => getByTestId('send-eo'));

        expect(sendButton).not.toHaveAttribute('disabled');
    });
});
