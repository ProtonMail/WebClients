import { CryptoProxy } from '@protontech/crypto';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/tests/crypto';
import { EOClearAll, EOPassword, validID } from '../../../../helpers/tests/eo/helpers';
import { send } from './EOReply.test.helpers';

jest.setTimeout(20000);

// The "Message sent" notification is kept for at least 2.5s, which the test would otherwise wait out.
// Fake timers are not an option here: the EO message is decrypted with real crypto while rendering.
jest.mock('../../../../constants', () => ({
    ...jest.requireActual('../../../../constants'),
    MIN_DELAY_SENT_NOTIFICATION: 0,
}));

describe('EO Reply send', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should send a text/html reply', async () => {
        const expectedBlockquote = `
            <blockquote class="protonmail_quote" type="cite">
                Test EO body
            </blockquote>`;

        const {
            sendRequest,
            renderResult: { history },
        } = await send();

        const { data: decryptedReplyBody } = await CryptoProxy.decryptMessage({
            armoredMessage: sendRequest.data.ReplyBody,
            passwords: [EOPassword],
        });

        // Format the reply to remove all \n and spaces to check if they are equal
        const formattedReplyBody = decryptedReplyBody.replaceAll(/[ \n]/g, '');
        const formattedExpectedBody = expectedBlockquote.replaceAll(/[ \n]/g, '');

        expect(formattedReplyBody).toContain(formattedExpectedBody);

        expect(history.location.pathname).toBe(`/eo/message/${validID}`);
    });
});
