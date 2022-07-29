import { MutableRefObject } from 'react';

import { fireEvent } from '@testing-library/dom';
import { getByText } from '@testing-library/react';

import { Recipient } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { mergeMessages } from '../../../helpers/message/messages';
import { addApiMock, clearAll, getDropdown, render, tick } from '../../../helpers/test/helper';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { MessageState } from '../../../logic/messages/messagesTypes';
import AddressesEditor from './AddressesEditor';

const email1 = 'test@test.com';
const email2 = 'test2@test.com';
const email3 = 'test3@test.com';

const email1Name = 'email1Name';
const email2Name = 'email2Name';

const contact1ID = '1';
const contact2ID = '2';

const recipient1: Recipient = { Address: email1, Name: email1Name, ContactID: contact1ID };
const recipient2: Recipient = { Address: email2, Name: email2Name, ContactID: contact2ID };

const message: MessageState = {
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
    handleContactModal: jest.fn(),
};

describe('AddressesEditor', () => {
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
        addApiMock('keys', () => ({}));

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
        addApiMock('contacts/v4/contacts', () => ({ Contacts: [] }));

        const { getAllByTestId } = await render(<AddressesEditor {...props} />);

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        const createContactButton = getByText(dropdown, 'Create new contact');

        fireEvent.click(createContactButton);

        await tick();

        getByText(document.body, 'Create contact');
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
});
