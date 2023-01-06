import { MESSAGE_ACTIONS } from '../../../../constants';
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
import { getStateMessageFromParentID, setupQuickReplyTests } from './QuickReply.test.helpers';

jest.setTimeout(20000);

describe('Quick reply - Reply type', function () {
    beforeEach(() => {
        setFeatureFlags('QuickReply', true);
    });

    afterEach(() => {
        clearAll();
    });

    let meKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        meKeys = await generateKeys('me', fromFields.meAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should be possible to switch the quick reply type when user received a message', async () => {
        // Setup test
        const { openQuickReply, updateReplyType, getRecipientList, createCall, updateCall } =
            await setupQuickReplyTests({
                meKeys,
                isPlainText: true,
            });
        await openQuickReply();

        /**
         * Initialisation check
         */
        const messageFromState = getStateMessageFromParentID(messageID);

        // List is the one expected on the UI
        const expectedList = `${data.quickReplyRecipientsStart} ${fromFields.fromName}`;
        const recipientList = await getRecipientList();
        expect(recipientList).toEqual(expectedList);
        // List is the one expected in the state
        expect(messageFromState?.data?.ToList).toEqual([recipients.fromRecipient]);
        expect(messageFromState?.data?.CCList).toEqual([]);
        expect(messageFromState?.data?.BCCList).toEqual([]);

        // Auto-save has not been called yet
        expect(createCall).not.toHaveBeenCalled();

        /**
         * Switch to reply all
         */
        await updateReplyType(MESSAGE_ACTIONS.REPLY_ALL, true);

        const messageFromStateAfterUpdate1 = getStateMessageFromParentID(messageID);
        const expectedListAfterUpdate1 = `${data.quickReplyRecipientsStart} ${fromFields.fromName}, ${fromFields.toName}, ${fromFields.ccName}`;
        const recipientListAfterUpdate1 = await getRecipientList();
        expect(recipientListAfterUpdate1).toEqual(expectedListAfterUpdate1);
        // List is the one expected in the state
        expect(messageFromStateAfterUpdate1?.data?.ToList).toEqual([recipients.fromRecipient]);
        expect(messageFromStateAfterUpdate1?.data?.CCList).toEqual([recipients.toRecipient, recipients.ccRecipient]);
        expect(messageFromStateAfterUpdate1?.data?.BCCList).toEqual([]);

        // Auto-save has been called
        expect(createCall).toHaveBeenCalled();

        /**
         * Switch back to reply
         */
        await updateReplyType(MESSAGE_ACTIONS.REPLY);

        const messageFromStateAfterUpdate2 = getStateMessageFromParentID(messageID);
        expect(recipientList).toEqual(expectedList);
        // List is the one expected in the state
        expect(messageFromStateAfterUpdate2?.data?.ToList).toEqual([recipients.fromRecipient]);
        expect(messageFromStateAfterUpdate2?.data?.CCList).toEqual([]);
        expect(messageFromStateAfterUpdate2?.data?.BCCList).toEqual([]);

        // Auto-save update has been called
        expect(updateCall).toHaveBeenCalled();
    });

    it('should be possible to switch the quick reply type when user sent a message', async () => {
        // Setup test
        const { openQuickReply, updateReplyType, getRecipientList, createCall, updateCall } =
            await setupQuickReplyTests({
                meKeys,
                isPlainText: true,
                isSender: true,
            });
        await openQuickReply();

        /**
         * Initialisation check
         */
        const messageFromState = getStateMessageFromParentID(messageID);

        // List is the one expected on the UI
        const expectedList = `${data.quickReplyRecipientsStart} ${fromFields.fromName}, ${fromFields.toName}`;
        const recipientList = await getRecipientList();
        expect(recipientList).toEqual(expectedList);
        // List is the one expected in the state
        expect(messageFromState?.data?.ToList).toEqual([recipients.fromRecipient, recipients.toRecipient]);
        expect(messageFromState?.data?.CCList).toEqual([]);
        expect(messageFromState?.data?.BCCList).toEqual([]);

        // Auto-save has not been called yet
        expect(createCall).not.toHaveBeenCalled();

        /**
         * Switch to reply all
         */
        await updateReplyType(MESSAGE_ACTIONS.REPLY_ALL, true);

        const messageFromStateAfterUpdate1 = getStateMessageFromParentID(messageID);
        const expectedListAfterUpdate1 = `${data.quickReplyRecipientsStart} ${fromFields.fromName}, ${fromFields.toName}, ${fromFields.ccName}, ${fromFields.bccName}`;
        const recipientListAfterUpdate1 = await getRecipientList();
        expect(recipientListAfterUpdate1).toEqual(expectedListAfterUpdate1);
        // List is the one expected in the state
        expect(messageFromStateAfterUpdate1?.data?.ToList).toEqual([recipients.fromRecipient, recipients.toRecipient]);
        expect(messageFromStateAfterUpdate1?.data?.CCList).toEqual([recipients.ccRecipient]);
        expect(messageFromStateAfterUpdate1?.data?.BCCList).toEqual([recipients.bccRecipient]);

        // Auto-save has been called
        expect(createCall).toHaveBeenCalled();

        /**
         * Switch back to reply
         */
        await updateReplyType(MESSAGE_ACTIONS.REPLY);
        const messageFromStateAfterUpdate2 = getStateMessageFromParentID(messageID);
        expect(recipientList).toEqual(expectedList);
        // List is the one expected in the state
        expect(messageFromStateAfterUpdate2?.data?.ToList).toEqual([recipients.fromRecipient, recipients.toRecipient]);
        expect(messageFromState?.data?.CCList).toEqual([]);
        expect(messageFromState?.data?.BCCList).toEqual([]);

        // Auto-save update has been called
        expect(updateCall).toHaveBeenCalled();
    });
});
