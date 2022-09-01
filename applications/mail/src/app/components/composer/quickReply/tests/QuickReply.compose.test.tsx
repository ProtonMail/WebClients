import {
    GeneratedKey,
    clearAll,
    generateKeys,
    releaseCryptoProxy,
    setFeatureFlags,
    setupCryptoProxyForTesting,
} from '../../../../helpers/test/helper';
import { messageID } from '../../../message/tests/Message.test.helpers';
import { data, fromFields, recipients } from './QuickReply.test.data';
import { getStateMessageFromParentID, removeLineBreaks, setupQuickReplyTests } from './QuickReply.test.helpers';

jest.setTimeout(20000);

describe('Quick reply - Compose', () => {
    let meKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        meKeys = await generateKeys('me', fromFields.meAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        setFeatureFlags('QuickReply', true);
    });

    afterEach(() => {
        clearAll();
    });

    it('should open a plaintext quick reply and be able to modify it', async () => {
        // Setup test
        const {
            openQuickReply,
            updateQuickReplyContent,
            sendQuickReply,
            getPlainTextEditor,
            expectedDefaultPlainTextContent,
            createCall,
            sendCall,
        } = await setupQuickReplyTests({ meKeys, isPlainText: true });
        await openQuickReply();
        const plainTextEditor = await getPlainTextEditor();

        /**
         * Initialisation check
         */
        // Plaintext editor should contain only the signature by default in QR
        // Because we hide the reply
        expect(plainTextEditor?.value.trim()).toEqual(data.protonSignature);

        // However, the state should contain the whole message (message + sig + blockquotes content)
        const messageFromState = getStateMessageFromParentID(messageID);
        expect(removeLineBreaks(messageFromState?.messageDocument?.plainText || '')).toEqual(
            removeLineBreaks(expectedDefaultPlainTextContent)
        );
        // Sender and Recipients are correct
        expect(messageFromState?.data?.Sender.Address).toEqual(fromFields.meAddress);
        expect(messageFromState?.data?.ToList).toEqual([recipients.fromRecipient]);

        // Auto-save has not been called yet
        expect(createCall).not.toHaveBeenCalled();

        /**
         * Check after making a change in the editor
         * After passing the whole composer logic, we still don't have the reply added to the content
         */
        const newContent = 'Adding content';
        const contentChange = `${newContent} ${data.protonSignature}`;

        // Type something in the editor
        await updateQuickReplyContent(contentChange);
        // Content in the editor is the one expected
        expect(removeLineBreaks(plainTextEditor?.value || '')).toEqual(removeLineBreaks(contentChange));

        // Content in the state is the one expected
        const messageFromStateAfterUpdate = getStateMessageFromParentID(messageID);
        const expectedUpdatedContent = `${newContent} ${expectedDefaultPlainTextContent}`;
        expect(removeLineBreaks(messageFromStateAfterUpdate?.messageDocument?.plainText || '')).toEqual(
            removeLineBreaks(expectedUpdatedContent)
        );

        // Auto-save has been called
        expect(createCall).toHaveBeenCalled();

        /**
         * Send the quick reply
         */
        await sendQuickReply();

        expect(sendCall).toHaveBeenCalled();
        const sendRequest = (sendCall.mock.calls[0] as any[])[0];
        expect(sendRequest.method).toBe('post');
    });

    it('should open an HTML quick reply and be able to modify it', async () => {
        const referenceMessageContent = 'Reference message content';

        const { openQuickReply, updateQuickReplyContent, getRoosterEditor, sendQuickReply, createCall, sendCall } =
            await setupQuickReplyTests({
                meKeys,
                referenceMessageBody: `<div>${referenceMessageContent}<br><div>`,
            });
        await openQuickReply();

        const roosterEditor = await getRoosterEditor();

        const messageFromState = getStateMessageFromParentID(messageID);

        /**
         * Initialisation check
         */
        // Editor should contain only the signature by default in QR
        // Because we hide the reply
        let protonSignature;
        let protonBlockquotes;
        if (roosterEditor) {
            protonSignature = roosterEditor.innerHTML.includes('Sent with');
            protonBlockquotes = roosterEditor.innerHTML.includes(referenceMessageContent);
        }

        // Editor
        // Signature is found in the editor
        expect(protonSignature).toBeTruthy();
        // Blockquotes are not present in the editor
        expect(protonBlockquotes).toBeFalsy();

        // Redux state
        // Signature is found in the state
        const messageInnerHTML = messageFromState?.messageDocument?.document?.innerHTML || '';
        expect(messageInnerHTML.includes('Sent with')).toBeTruthy();
        // Blockquotes are present in the state
        expect(messageInnerHTML.includes(referenceMessageContent)).toBeTruthy();

        // Auto-save has not been called yet
        expect(createCall).not.toHaveBeenCalled();

        /**
         * Check after making a change in the editor
         * After passing the whole composer logic, we still don't have the reply added to the content
         */
        const newContent = 'Adding content';

        // Type something in the editor
        await updateQuickReplyContent(newContent);
        const messageFromStateAfterUpdate = getStateMessageFromParentID(messageID);

        let protonContentAfterUpdate;
        let protonSignatureAfterUpdate;
        let protonBlockquotesAfterUpdate;
        if (roosterEditor) {
            protonContentAfterUpdate = roosterEditor.innerHTML.includes(newContent);
            protonSignatureAfterUpdate = roosterEditor.innerHTML.includes('Sent with');
            protonBlockquotesAfterUpdate = roosterEditor.innerHTML.includes(referenceMessageContent);
        }

        // Editor
        // New content is found in the editor
        expect(protonContentAfterUpdate).toBeTruthy();
        // Signature is found in the editor
        expect(protonSignatureAfterUpdate).toBeTruthy();
        // Blockquotes are not present in the editor
        expect(protonBlockquotesAfterUpdate).toBeFalsy();

        // Redux state
        const messageInnerHTMLAfterUpdate = messageFromStateAfterUpdate?.messageDocument?.document?.innerHTML || '';
        // New content is found in the state
        expect(messageInnerHTMLAfterUpdate.includes(newContent)).toBeTruthy();
        // Signature is found in the state
        expect(messageInnerHTMLAfterUpdate.includes('Sent with')).toBeTruthy();
        // Blockquotes are present in the state
        expect(messageInnerHTMLAfterUpdate.includes(referenceMessageContent)).toBeTruthy();

        // Auto-save has been called
        expect(createCall).toHaveBeenCalled();

        /**
         * Send the quick reply
         */
        await sendQuickReply();
        await expect(sendCall).toHaveBeenCalled();
        const sendRequest = (sendCall.mock.calls[0] as any[])[0];
        expect(sendRequest.method).toBe('post');
    });
});
