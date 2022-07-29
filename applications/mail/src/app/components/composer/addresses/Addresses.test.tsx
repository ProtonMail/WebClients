import { MutableRefObject } from 'react';

import { fireEvent, getAllByRole } from '@testing-library/dom';
import { act, getByText } from '@testing-library/react';

import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { mergeMessages } from '../../../helpers/message/messages';
import { addApiMock, addToCache, clearAll, minimalCache, render } from '../../../helpers/test/helper';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { MessageState } from '../../../logic/messages/messagesTypes';
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

const props = {
    message,
    messageSendInfo,
    disabled: false,
    onChange: jest.fn(),
    addressesBlurRef: {} as MutableRefObject<() => void>,
    addressesFocusRef: {} as MutableRefObject<() => void>,
};

describe('Addresses', () => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

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
    });

    afterEach(clearAll);

    it('should render Addresses', async () => {
        const { getByText } = await render(<Addresses {...props} />);

        getByText(email1Name);
        getByText(email2Name);
    });

    it('should add a contact from insert contact modal', async () => {
        minimalCache();
        addToCache('ContactEmails', contactEmails);
        addApiMock('keys', () => ({}));

        const { getByTestId, getAllByTestId, rerender } = await render(<Addresses {...props} />, false);

        const toButton = getByTestId('composer:to-button');

        // Open the modal
        fireEvent.click(toButton);

        const modal = getByTestId('modal:contactlist');

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
        expect(props.onChange).toHaveBeenCalledWith(expectedChange);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<Addresses {...props} message={updatedMessage} />);

        const updatedAddresses = getAllByTestId('composer-addresses-item');
        expect(updatedAddresses.length).toEqual(3);
    });
});
