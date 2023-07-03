import { act } from 'react-dom/test-utils';

import { fireEvent } from '@testing-library/react';
import { RenderResult, queryByTestId } from '@testing-library/react';

import { INCOMING_DEFAULTS_LOCATION, MIME_TYPES } from '@proton/shared/lib/constants';
import { IncomingDefault, MailSettings, Recipient } from '@proton/shared/lib/interfaces';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

import {
    addApiMock,
    addToCache,
    clearAll,
    getDropdown,
    minimalCache,
    render,
    setFeatureFlags,
    waitForNotification,
} from '../../../../helpers/test/helper';
import { load } from '../../../../logic/incomingDefaults/incomingDefaultsActions';
import { MessageState } from '../../../../logic/messages/messagesTypes';
import { store } from '../../../../logic/store';
import MailRecipientItemSingle from '../MailRecipientItemSingle';

const meAddress = 'me@protonmail.com';
const me2Address = 'me2@protonmail.com';
const alreadyBlockedAddress = 'alreadyBlocked@protonmail.com';
const recipientAddress = 'recipient@protonmail.com';
const normalSenderAddress = 'normalSender@protonmail.com';
const spamSenderAddress = 'spamSender@protonmail.com';
const inboxSenderAddress = 'inboxSender@protonmail.com';

const spamSenderID = 'spamSender';

const modalsHandlers = {
    onContactDetails: jest.fn(),
    onContactEdit: jest.fn(),
};

const getTestMessageToBlock = (sender: Recipient) => {
    return {
        localID: 'message',
        data: {
            ID: 'message',
            MIMEType: 'text/plain' as MIME_TYPES,
            Subject: '',
            Sender: sender,
            ToList: [] as Recipient[],
            ConversationID: 'conversationID',
        },
    } as MessageState;
};

const openDropdown = async (container: RenderResult, sender: Recipient) => {
    const { getByTestId } = container;
    const recipientItem = getByTestId(`recipient:details-dropdown-${sender.Address}`);

    fireEvent.click(recipientItem);

    const fromDropdown = await getDropdown();
    return fromDropdown;
};

const setup = async (sender: Recipient, isRecipient = false, hasBlockSenderConfimationChecked = false) => {
    minimalCache();
    addToCache('MailSettings', {
        BlockSenderConfirmation: hasBlockSenderConfimationChecked ? BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK : undefined,
    } as MailSettings);

    addToCache('Addresses', [
        {
            Email: meAddress,
        },
        {
            Email: me2Address,
        },
    ]);

    setFeatureFlags('BlockSender', true);

    addApiMock('mail/v4/incomingdefaults', () => {
        return {
            IncomingDefaults: [
                {
                    ID: 'alreadyBlocked',
                    Email: alreadyBlockedAddress,
                    Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
                },
                {
                    ID: spamSenderID,
                    Email: spamSenderAddress,
                    Location: INCOMING_DEFAULTS_LOCATION.SPAM,
                },
                {
                    ID: 'inboxSender',
                    Email: inboxSenderAddress,
                    Location: INCOMING_DEFAULTS_LOCATION.INBOX,
                },
            ] as IncomingDefault[],
            Total: 1,
            GlobalTotal: 3,
        };
    });
    const message = getTestMessageToBlock(sender);

    const container = await render(
        <MailRecipientItemSingle message={message} recipient={sender} isRecipient={isRecipient} {...modalsHandlers} />,
        false
    );

    // Load manually incoming defaults
    await store.dispatch(load());

    const dropdown = await openDropdown(container, sender);

    const blockSenderOption = queryByTestId(dropdown, 'block-sender:button');

    return { container, dropdown, blockSenderOption };
};

describe('MailRecipientItemSingle block sender option in dropdown', () => {
    afterEach(clearAll);

    it('should not be possible to block sender if sender is the user', async () => {
        const sender = {
            Name: 'Me',
            Address: meAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).toBeNull();
    });

    it('should not be possible to block sender if sender is a secondary address of the user', async () => {
        const sender = {
            Name: 'Me2',
            Address: me2Address,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).toBeNull();
    });

    it('should not be possible to block sender if sender is already blocked', async () => {
        const sender = {
            Name: 'already blocked',
            Address: alreadyBlockedAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).toBeNull();
    });

    it('should not be possible to block sender if item is a recipient and not a sender', async () => {
        const sender = {
            Name: 'recipient',
            Address: recipientAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender, true);

        expect(blockSenderOption).toBeNull();
    });

    it('should be possible to block sender', async () => {
        const sender = {
            Name: 'normal sender',
            Address: normalSenderAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).not.toBeNull();
    });

    it('should be possible to block sender if already flagged as spam', async () => {
        const sender = {
            Name: 'spam sender',
            Address: spamSenderAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).not.toBeNull();
    });

    it('should be possible to block sender if already flagged as inbox', async () => {
        const sender = {
            Name: 'inbox sender',
            Address: inboxSenderAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender);

        expect(blockSenderOption).not.toBeNull();
    });
});

describe('MailRecipientItemSingle blocking a sender', () => {
    afterEach(clearAll);

    const blockSender = async (
        container: RenderResult,
        senderAddress: string,
        blockSenderOption: HTMLElement | null,
        selectDoNotAsk = false
    ) => {
        const { findByText, findByTestId } = container;

        if (blockSenderOption) {
            fireEvent.click(blockSenderOption);
        }

        // Modal is displayed
        await findByText('Block sender');
        await findByText(`New emails from ${senderAddress} won't be delivered and will be permanently deleted.`);

        // Should check do not ask again
        if (selectDoNotAsk) {
            const checkbox = await findByTestId('block-sender-modal-dont-show:checkbox');

            act(() => {
                fireEvent.click(checkbox);
            });
        }

        // Block sender
        const blockButton = await findByTestId('block-sender-modal-block:button');

        act(() => {
            fireEvent.click(blockButton);
        });
    };

    it('should block a sender', async () => {
        const createSpy = jest.fn(() => ({
            IncomingDefault: {
                ID: 'normalSender',
                Email: normalSenderAddress,
                Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
            } as IncomingDefault,
        }));

        addApiMock('mail/v4/incomingdefaults?Overwrite=1', createSpy, 'post');

        const sender = {
            Name: 'normal sender',
            Address: normalSenderAddress,
        } as Recipient;

        const { container, blockSenderOption } = await setup(sender);

        await blockSender(container, normalSenderAddress, blockSenderOption);

        expect(createSpy).toHaveBeenCalled();

        await waitForNotification(`Sender ${normalSenderAddress} blocked`);
    });

    it('should block a sender already in incoming defaults', async () => {
        const createSpy = jest.fn(() => ({
            IncomingDefault: {
                Email: spamSenderAddress,
                Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
            } as IncomingDefault,
        }));

        addApiMock(`mail/v4/incomingdefaults?Overwrite=1`, createSpy, 'post');

        const sender = {
            Name: 'spam sender',
            Address: spamSenderAddress,
        } as Recipient;

        const { container, blockSenderOption } = await setup(sender);

        await blockSender(container, spamSenderAddress, blockSenderOption);

        expect(createSpy).toHaveBeenCalled();
        await waitForNotification(`Sender ${spamSenderAddress} blocked`);
    });

    it('should block a sender and apply do not ask', async () => {
        const createSpy = jest.fn(() => ({
            IncomingDefault: {
                ID: 'normalSender',
                Email: normalSenderAddress,
                Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
            } as IncomingDefault,
        }));

        addApiMock('mail/v4/incomingdefaults?Overwrite=1', createSpy, 'post');

        const doNotAskSpy = jest.fn(() => ({
            BlockSenderConfirmation: BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK,
        }));
        addApiMock('mail/v4/settings/block-sender-confirmation', doNotAskSpy, 'put');

        const sender = {
            Name: 'normal sender',
            Address: normalSenderAddress,
        } as Recipient;

        const { container, blockSenderOption } = await setup(sender);

        await blockSender(container, normalSenderAddress, blockSenderOption, true);

        expect(createSpy).toHaveBeenCalled();
        expect(doNotAskSpy).toHaveBeenCalled();

        await waitForNotification(`Sender ${normalSenderAddress} blocked`);
    });

    it('should block a sender and not open the modal', async () => {
        const createSpy = jest.fn(() => ({
            IncomingDefault: {
                ID: 'normalSender',
                Email: normalSenderAddress,
                Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
            } as IncomingDefault,
        }));

        addApiMock('mail/v4/incomingdefaults?Overwrite=1', createSpy, 'post');

        const sender = {
            Name: 'normal sender',
            Address: normalSenderAddress,
        } as Recipient;

        const { blockSenderOption } = await setup(sender, false, true);

        // Click on block sender option, no modal should be displayed
        if (blockSenderOption) {
            fireEvent.click(blockSenderOption);
        }

        expect(createSpy).toHaveBeenCalled();
        await waitForNotification(`Sender ${normalSenderAddress} blocked`);
    });
});
