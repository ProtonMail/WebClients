import React, { MutableRefObject } from 'react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces';
import { act, getByText, getAllByRole } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';

import { addToCache, clearAll, getDropdown, getModal, minimalCache, render } from '../../../helpers/test/helper';
import AddressesEditor from './AddressesEditor';
import { MessageExtended } from '../../../models/message';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { mergeMessages } from '../../../helpers/message/messages';

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

const message: MessageExtended = {
    localID: 'localId',
    data: {
        ToList: [recipient1, recipient2],
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
    onChange: jest.fn(),
    expanded: false,
    toggleExpanded: jest.fn(),
    inputFocusRefs: {
        to: {} as MutableRefObject<() => void>,
        cc: {} as MutableRefObject<() => void>,
    },
};

describe('AddressesEditor', () => {
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
        const { getByText } = await render(<AddressesEditor {...props} />);

        getByText(`${email1Name} <${email1}>`);
        getByText(`${email2Name} <${email2}>`);
    });

    it('should delete an address', async () => {
        const { getByTestId, getAllByTestId, rerender } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item');

        expect(displayedAddresses.length).toEqual(2);

        const email2RemoveButton = getByTestId(`remove-address-button-${email2}`);

        fireEvent.click(email2RemoveButton);

        const expectedChange = { data: { ToList: [recipient1] } };
        expect(props.onChange).toHaveBeenCalledWith(expectedChange);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<AddressesEditor {...props} message={updatedMessage} />);

        const remainingAddresses = getAllByTestId('composer-addresses-item');
        expect(remainingAddresses.length).toEqual(1);
    });

    it('should add an address', async () => {
        const { getAllByTestId, getByTestId, rerender } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item');

        expect(displayedAddresses.length).toEqual(2);

        const addressesInput = getByTestId('composer:to');

        fireEvent.change(addressesInput, { target: { value: email3 } });
        fireEvent.keyDown(addressesInput, { key: 'Enter' });

        const expectedChange = { data: { ToList: [recipient1, recipient2, { Address: email3, Name: email3 }] } };
        expect(props.onChange).toHaveBeenCalledWith(expectedChange);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<AddressesEditor {...props} message={updatedMessage} />);

        const newAddresses = getAllByTestId('composer-addresses-item');
        expect(newAddresses.length).toEqual(3);
    });

    it('should edit an address on double click', async () => {
        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        const addressSpan = displayedAddresses[0];
        expect(addressSpan.getAttribute('contenteditable')).toEqual('false');

        fireEvent.dblClick(addressSpan);

        expect(addressSpan.getAttribute('contenteditable')).toEqual('true');

        fireEvent.change(addressSpan, {
            target: { innerHTML: email3 },
        });
        fireEvent.keyDown(addressSpan, { key: 'Enter' });

        expect(props.onChange).toHaveBeenCalledWith({
            data: { ToList: [{ Address: email3, Name: email3 }, recipient2] },
        });
    });

    it('should open option dropdown', async () => {
        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        getByText(dropdown, 'Copy address');
        getByText(dropdown, 'Edit address');
        getByText(dropdown, 'Create new contact');
        getByText(dropdown, 'Remove');
    });

    it('should copy an address', async () => {
        document.execCommand = jest.fn();

        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        const copyAddressButton = getByText(dropdown, 'Copy address');

        fireEvent.click(copyAddressButton);

        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should edit an address in option dropdown', async () => {
        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        const addressSpan = displayedAddresses[0];
        fireEvent.contextMenu(addressSpan);

        const dropdown = await getDropdown();

        const editAddressButton = getByText(dropdown, 'Edit address');

        fireEvent.click(editAddressButton);

        expect(addressSpan.getAttribute('contenteditable')).toEqual('true');

        fireEvent.change(addressSpan, {
            target: { innerHTML: email3 },
        });

        fireEvent.keyDown(addressSpan, { key: 'Enter' });

        expect(props.onChange).toHaveBeenCalledWith({
            data: { ToList: [{ Address: email3, Name: email3 }, recipient2] },
        });
    });

    it('should open create modal when clicking on create contact', async () => {
        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        const createContactButton = getByText(dropdown, 'Create new contact');

        fireEvent.click(createContactButton);

        await act(async () => {
            const { modal } = await getModal();

            getByText(modal, 'Create contact');
        });
    });

    it('should delete an address in option modal', async () => {
        const { getAllByTestId, rerender } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        expect(displayedAddresses.length).toEqual(2);

        const addressSpan = displayedAddresses[0];
        fireEvent.contextMenu(addressSpan);

        const dropdown = await getDropdown();

        const removeAddressButton = getByText(dropdown, 'Remove');

        fireEvent.click(removeAddressButton);

        const expectedChange = { data: { ToList: [recipient2] } };
        expect(props.onChange).toHaveBeenCalledWith(expectedChange);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<AddressesEditor {...props} message={updatedMessage} />);

        const remainingAddresses = getAllByTestId('composer-addresses-item');
        expect(remainingAddresses.length).toEqual(1);
    });

    it('should add a contact from insert contact modal', async () => {
        minimalCache();
        addToCache('ContactEmails', contactEmails);

        const { getByTestId, getAllByTestId, rerender } = await render(<AddressesEditor {...props} />, false);

        const toButton = getByTestId('composer:to-button');

        // Open the modal
        fireEvent.click(toButton);

        await act(async () => {
            const { modal } = await getModal();

            // Check if the modal is displayed with all contacts
            getByText(modal, 'Insert contacts');
            getByText(modal, contactEmails[0].Name);
            getByText(modal, contactEmails[1].Name);
            getByText(modal, contactEmails[2].Name);

            // Expect contacts "email1" and "email2" to be checked by default
            const checkedCheckboxes = getAllByRole(modal, 'checkbox', { checked: true });
            expect(checkedCheckboxes.length).toEqual(2);

            // Expect contact "email3" and "select all" checkboxes not to be checked
            const notCheckedCheckboxes = getAllByRole(modal, 'checkbox', { checked: false });
            expect(notCheckedCheckboxes.length).toEqual(2);

            // Click on a non-checked checkbox (does not matter if this is the select all as long as there is only 3 contacts here)
            fireEvent.click(notCheckedCheckboxes[0]);

            // Check if all checkboxes are now checked
            const checkedCheckboxesAfterClick = getAllByRole(modal, 'checkbox', { checked: true });
            expect(checkedCheckboxesAfterClick.length).toEqual(4);

            // Insert the third contact
            const insertButton = getByText(modal, 'Insert 3 contacts');
            fireEvent.click(insertButton);
        });

        // Expect to have all three contacts
        const expectedChange = { data: { ToList: [recipient1, recipient2, recipient3] } };
        expect(props.onChange).toHaveBeenCalledWith(expectedChange);

        const updatedMessage = mergeMessages(message, expectedChange);

        await rerender(<AddressesEditor {...props} message={updatedMessage} />);

        const updatedAddresses = getAllByTestId('composer-addresses-item');
        expect(updatedAddresses.length).toEqual(3);
    });
});
