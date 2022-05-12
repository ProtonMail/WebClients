import { CryptoProxy } from '@proton/crypto';
import { send } from './EOReply.test.helpers';
import { EOClearAll, EOPassword, validID } from '../../../../helpers/test/eo/helpers';
import { EOGetHistory } from '../../../../helpers/test/eo/EORender';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';

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

        const sendRequest = await send();

        const { data: decryptedReplyBody } = await CryptoProxy.decryptMessage({
            armoredMessage: sendRequest.data.ReplyBody,
            passwords: [EOPassword],
        });

        // Format the reply to remove all \n and spaces to check if they are equal
        const formattedReplyBody = decryptedReplyBody.replaceAll(/[ \n]/g, '');
        const formattedExpectedBody = expectedBlockquote.replaceAll(/[ \n]/g, '');

        expect(formattedReplyBody).toContain(formattedExpectedBody);

        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo/message/${validID}`);
    });
});
