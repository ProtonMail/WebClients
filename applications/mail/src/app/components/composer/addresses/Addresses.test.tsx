import { MutableRefObject } from 'react';

import { fireEvent, getAllByRole, screen } from '@testing-library/react';
import { act, getByText } from '@testing-library/react';

import { pick } from '@proton/shared/lib/helpers/object';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { mergeMessages } from '../../../helpers/message/messages';
import { addApiMock, addToCache, clearAll, minimalCache, render } from '../../../helpers/test/helper';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { composerActions } from '../../../logic/composers/composersSlice';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { store } from '../../../logic/store';
import Addresses from './Addresses';

const email1 = 'test@test.com';
const email2 = 'test2@test.com';
const email3 = 'test3@test.com';

const email1Name = 'email1Name';
const email2Name = 'email2Name';
const email3Name = 'email3Name';

const contact1ID = '1';
const contact2ID = '2';
const contact3ID = '3';

const recipient1: Recipient = { Address: email1, Name: email1Name, ContactID: contact1ID };
const recipient2: Recipient = { Address: email2, Name: email2Name, ContactID: contact2ID };
const recipient3: Recipient = { Address: email3, Name: email3Name, ContactID: contact3ID };

const contactEmails: ContactEmail[] = [
    {
        ID: contact1ID,
        Email: email1,
        Name: email1Name,
        Type: [],
        Defaults: 1,
        Order: 1,
        ContactID: contact1ID,
        LabelIDs: [],
        LastUsedTime: 1,
    },
    {
        ID: contact2ID,
        Email: email2,
        Name: email2Name,
        Type: [],
        Defaults: 2,
        Order: 2,
        ContactID: contact2ID,
        LabelIDs: [],
        LastUsedTime: 2,
    },
    {
        ID: contact3ID,
        Email: email3,
        Name: email3Name,
        Type: [],
        Defaults: 3,
        Order: 3,
        ContactID: contact3ID,
        LabelIDs: [],
        LastUsedTime: 3,
    },
];

const message: MessageState = {
    localID: 'localId',
    data: {
        Sender: { Address: 'dude@dude.fr' },
        AddressID: 'AddressID',
        ToList: [recipient1, recipient2],
        CCList: [] as Recipient[],
        BCCList: [] as Recipient[],
    } as Message,
};

const messageSendInfo: MessageSendInfo = {
    message,
    mapSendInfo: {
        [email1]: {
            loading: false,
            emailValidation: true,
        },
        [email2]: {
            loading: false,
            emailValidation: true,
        },
    },
    setMapSendInfo: () => jest.fn(),
};

const DEFAULT_PROPS = {
    message,
    messageSendInfo,
    disabled: false,
    onChange: jest.fn(),
    addressesBlurRef: {} as MutableRefObject<() => void>,
    addressesFocusRef: {} as MutableRefObject<() => void>,
} as const;

const setup = async ({
    messageProp,
    minimalCache = true,
}: {
    messageProp?: Partial<MessageState>;
    minimalCache?: boolean;
} = {}) => {
    const nextMessage = mergeMessages(DEFAULT_PROPS.message, messageProp || {});
    store.dispatch(
        composerActions.addComposer({
            messageID: nextMessage.localID || '',
            // @ts-expect-error
            recipients: pick(nextMessage?.data, ['ToList', 'CCList', 'BCCList']),
            // @ts-expect-error
            senderEmailAddress: nextMessage.data?.Sender.Address,
        })
    );
    const composerID = Object.keys(store.getState().composers.composers)[0];

    const result = await render(
        <Addresses {...DEFAULT_PROPS} message={nextMessage} composerID={composerID} />,
        minimalCache
    );

    return { ...result, composerID };
};

describe('Addresses', () => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

    beforeEach(clearAll);
    // Used to render the Autosizer contact list
    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 50 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 50 });
    });

    afterAll(() => {
        if (originalOffsetHeight && originalOffsetWidth) {
            Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
            Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
        }
        clearAll();
    });

    it('should render Addresses', async () => {
        await setup();

        screen.getByText(email1Name);
        screen.getByText(email2Name);
    });

    it('should add a contact from insert contact modal', async () => {
        minimalCache();
        addToCache('ContactEmails', contactEmails);
        addApiMock('core/v4/keys', () => ({}));

        const { rerender, composerID } = await setup({ minimalCache: false });

        const toButton = screen.getByTestId('composer:to-button');

        // Open the modal
        fireEvent.click(toButton);

        const modal = screen.getByTestId('modal:contactlist');

        // Check if the modal is displayed with all contacts
        getByText(modal, 'Insert contacts');
        getByText(modal, contactEmails[0].Name);
        getByText(modal, contactEmails[1].Name);
        getByText(modal, contactEmails[2].Name);

        // Expect contacts "email1" and "email2" to be checked by default
        const checkedCheckboxes = getAllByRole(modal, 'checkbox', { checked: true, hidden: true });
        expect(checkedCheckboxes.length).toEqual(2);

        // Expect contact "email3" and "select all" checkboxes not to be checked
        const notCheckedCheckboxes = getAllByRole(modal, 'checkbox', { checked: false, hidden: true });
        expect(notCheckedCheckboxes.length).toEqual(2);

        await act(async () => {
            // Click on a non-checked checkbox (does not matter if this is the select all as long as there is only 3 contacts here)
            fireEvent.click(notCheckedCheckboxes[0]);
        });

        // Check if all checkboxes are now checked
        const checkedCheckboxesAfterClick = getAllByRole(modal, 'checkbox', { checked: true, hidden: true });
        expect(checkedCheckboxesAfterClick.length).toEqual(4);

        await act(async () => {
            // Insert the third contact
            const insertButton = getByText(modal, 'Insert 3 contacts');
            fireEvent.click(insertButton);
        });

        // Expect to have all three contacts
        const expectedChange = { data: { ToList: [recipient1, recipient2, recipient3] } };
        expect(store.getState().composers.composers[composerID].recipients.ToList).toEqual([
            recipient1,
            recipient2,
            recipient3,
        ]);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<Addresses {...DEFAULT_PROPS} message={updatedMessage} composerID={composerID} />);

        const updatedAddresses = screen.getAllByTestId('composer-addresses-item');
        expect(updatedAddresses.length).toEqual(3);
    });

    it('Should display CC field on click', async () => {
        await setup();

        // cc and bcc fields shoud be hidden
        expect(screen.queryByTestId('composer:to-cc')).toBe(null);
        expect(screen.queryByTestId('composer:to-bcc')).toBe(null);

        fireEvent.click(screen.getByTestId('composer:recipients:cc-button'));

        // cc field visible now
        await screen.findByTestId('composer:to-cc');

        fireEvent.click(screen.getByTestId('composer:recipients:bcc-button'));

        // bcc field visible now
        await screen.findByTestId('composer:to-bcc');
    });

    it('Summary has BCC contact so click on CC should displays CC field and BCC field', async () => {
        await setup({
            messageProp: {
                data: { BCCList: [recipient1] } as MessageState['data'],
            },
        });

        // cc and bcc fields shoud be hidden
        expect(screen.queryByTestId('composer:to-cc')).toBe(null);
        expect(screen.queryByTestId('composer:to-bcc')).toBe(null);

        fireEvent.click(screen.getByTestId('composer:recipients:cc-button'));

        const ccField = await screen.findByTestId('composer:to-cc');
        const bccField = await screen.findByTestId('composer:to-bcc');

        expect(ccField).not.toBe(null);
        expect(bccField).not.toBe(null);
    });

    it('Summary has CC contact so click on BCC should displays BCC field and CC field', async () => {
        await setup({
            messageProp: {
                data: { CCList: [recipient1] } as MessageState['data'],
            },
        });

        // cc and bcc fields shoud be hidden
        expect(screen.queryByTestId('composer:to-cc')).toBe(null);
        expect(screen.queryByTestId('composer:to-bcc')).toBe(null);

        fireEvent.click(screen.getByTestId('composer:recipients:bcc-button'));

        const ccField = await screen.findByTestId('composer:to-cc');
        const bccField = await screen.findByTestId('composer:to-bcc');

        expect(ccField).not.toBe(null);
        expect(bccField).not.toBe(null);
    });
});
