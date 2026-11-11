import { CryptoProxy } from '@protontech/crypto';
import { fireEvent, waitFor } from '@testing-library/react';

import { ROOSTER_EDITOR_ID } from '@proton/mail-composer/components/editor/constants';

import { addApiMock } from '../../../../helpers/tests/api';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/tests/crypto';
import { EOClearAll, EOPassword, validID } from '../../../../helpers/tests/eo/helpers';
import { waitForNotification } from '../../../../helpers/tests/helper';
import { send, setup } from './EOReply.test.helpers';

jest.setTimeout(20000);

// The "Message sent" notification is kept for at least 2.5s, which the test would otherwise wait out.
// Fake timers are not an option here: the EO message is decrypted with real crypto while rendering.
jest.mock('@proton/mail-composer/constants', () => ({
    ...jest.requireActual('@proton/mail-composer/constants'),
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

    /** A paste lands in the editor as a single content change. If that change never reaches
     *  the model, which is what `skipNextInputRef` does to the first one, the whole reply is
     *  lost rather than a single keystroke. The send has to read the editor, not the model.
     */
    it('should send content that only ever reached the editor', async () => {
        const pastedText = 'PASTED_REPLY_TEXT';
        const renderResult = await setup();

        const iframe = (await renderResult.findByTestId('rooster-iframe')) as HTMLIFrameElement;
        await waitFor(() => {
            expect(iframe.contentDocument?.getElementById(ROOSTER_EDITOR_ID)?.innerHTML).toBeTruthy();
        });

        const editorDocument = iframe.contentDocument as Document;
        const editorElement = editorDocument.getElementById(ROOSTER_EDITOR_ID) as HTMLElement;

        // Reproduce what a paste leaves behind without telling the model about it
        const pastedNode = editorDocument.createElement('span');
        pastedNode.textContent = pastedText;
        editorElement.insertBefore(pastedNode, editorElement.firstChild);

        const sendSpy = jest.fn(() => Promise.resolve({ Reply: {} }));
        addApiMock('mail/v4/eo/reply', sendSpy, 'post');

        fireEvent.click(await renderResult.findByTestId('send-eo'));
        await waitForNotification('Message sent');

        const sendRequest = (sendSpy.mock.calls[0] as any[])[0];
        const { data: decryptedReplyBody } = await CryptoProxy.decryptMessage({
            armoredMessage: sendRequest.data.ReplyBody,
            passwords: [EOPassword],
        });

        expect(decryptedReplyBody).toContain(pastedText);
        // The realignment must add the missing text without dropping the quoted original
        expect(decryptedReplyBody).toContain('protonmail_quote');
    });
});
