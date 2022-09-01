import {
    GeneratedKey,
    clearAll,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../../helpers/test/helper';
import { messageID } from '../../../message/tests/Message.test.helpers';
import {
    getStateMessageFromParentID,
    referenceMessageAddress,
    referenceMessageName,
    removeLineBreaks,
    setupQuickReplyTests,
    userAddress,
} from './QuickReply.test.helpers';

// TODO Will need to set the FF when it will be added

describe('Quick reply - Plaintext', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        clearAll();
        jest.useRealTimers();
    });

    const protonSignature = 'Sent with Proton Mail secure email.';

    let toKeys: GeneratedKey;
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('user', userAddress);
        fromKeys = await generateKeys('from', referenceMessageAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should open a plaintext quick reply and be able to modify it', async () => {
        // Setup test
        const {
            openQuickReply,
            updateQuickReplyContent,
            getPlainTextEditor,
            expectedDefaultPlainTextContent,
            createCall,
        } = await setupQuickReplyTests({ toKeys, fromKeys, isPlainText: true });
        await openQuickReply();
        const plainTextEditor = await getPlainTextEditor();

        /**
         * Initialisation check
         */
        // Plaintext editor should contain only the signature by default in QR
        // Because we hide the reply
        expect(plainTextEditor?.value.trim()).toEqual(protonSignature);

        // However, the state should contain the whole message (message + sig + blockquotes content)
        const messageFromState = getStateMessageFromParentID(messageID);
        expect(removeLineBreaks(messageFromState?.messageDocument?.plainText || '')).toEqual(
            removeLineBreaks(expectedDefaultPlainTextContent)
        );
        // Sender and Recipients are correct
        expect(messageFromState?.data?.Sender.Address).toEqual(userAddress);
        expect(messageFromState?.data?.ToList).toEqual([
            { Name: referenceMessageName, Address: referenceMessageAddress },
        ]);

        // Auto-save has not been called yet
        expect(createCall).not.toHaveBeenCalled();

        /**
         * Check after making a change in the editor
         * After passing the whole composer logic, we still don't have the reply added to the content
         */
        const newContent = 'Adding content';
        const contentChange = `${newContent} ${protonSignature}`;

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
    });

    it('should open an HTML quick reply and be able to modify it', async () => {
        const referenceMessageContent = 'Reference message content';

        const { openQuickReply, updateQuickReplyContent, getRoosterEditor, createCall } = await setupQuickReplyTests({
            toKeys,
            fromKeys,
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
        let protonBLockquotes;
        if (roosterEditor) {
            protonSignature = roosterEditor.innerHTML.includes('Sent with');
            protonBLockquotes = roosterEditor.innerHTML.includes(referenceMessageContent);
        }

        // Editor
        // Signature is found in the editor
        expect(protonSignature).toBeTruthy();
        // Blockquotes are not present in the editor
        expect(protonBLockquotes).toBeFalsy();

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
    });
});
