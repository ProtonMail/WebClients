import { decryptMessage, getMessage } from 'pmcrypto';
import { send } from './EOReply.test.helpers';
import { EOClearAll, EOPassword, validID } from '../../../../helpers/test/eo/helpers';
import { EOGetHistory } from '../../../../helpers/test/eo/EORender';

describe('EO Reply send', () => {
    afterEach(EOClearAll);

    it('should send a text/html reply', async () => {
        const expectedBlockquote = `
            <blockquote class="protonmail_quote" type="cite">
                Test EO body
            </blockquote>`;

        const sendRequest = await send();

        const replyBody = await getMessage(sendRequest.data.ReplyBody);

        const { data: decryptedReplyBody } = await decryptMessage({ message: replyBody, passwords: [EOPassword] });

        // Format the reply to remove all \n and spaces to check if they are equal
        const formattedReplyBody = decryptedReplyBody.replaceAll(/[ \n]/g, '');
        const formattedExpectedBody = expectedBlockquote.replaceAll(/[ \n]/g, '');

        expect(formattedReplyBody).toContain(formattedExpectedBody);

        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo/message/${validID}`);
    });
});
