import type { MutableRefObject } from 'react';

import { fireEvent, getByText, screen } from '@testing-library/react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { pick } from '@proton/shared/lib/helpers/object';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addComposerAction } from 'proton-mail/store/composers/composerActions';
import type { MailStore } from 'proton-mail/store/store';

import { addApiMock, clearAll, getDropdown, mailTestRender, tick } from '../../../helpers/test/helper';
import type { MessageSendInfo } from '../../../hooks/useSendInfo';
import AddressesEditor from './AddressesEditor';

const email1 = 'test@test.com';
const email2 = 'test2@test.com';
const email3 = 'test3@test.com';
const email4 = 'test4@test.com';

const email1Name = 'email1Name';
const email2Name = 'email2Name';
const email3Name = 'email3Name';

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

let ccExpanded = false;
let bccExpanded = false;

const props = {
    message,
    messageSendInfo,
    onChange: jest.fn(),
    expanded: false,
    toggleExpanded: jest.fn(),
    inputFocusRefs: {
        to: {} as MutableRefObject<() => void>,
        cc: {} as MutableRefObject<() => void>,
        bcc: {} as MutableRefObject<() => void>,
    },
    handleContactModal: jest.fn(),
    ccExpanded,
    bccExpanded,
    expandCC: () => {
        ccExpanded = true;
    },
    expandBCC: () => {
        bccExpanded = true;
    },
};

const setupComposer = (store: MailStore, composerID: string) => {
    store.dispatch(
        addComposerAction({
            ID: composerID,
            messageID: message.localID || '',
            // @ts-expect-error
            recipients: pick(message?.data, ['ToList', 'CCList', 'BCCList']),
            senderEmailAddress: message.data?.Sender?.Address || '',
        })
    );
};

describe('AddressesEditor', () => {
    beforeAll(() => {
        ccExpanded = false;
        bccExpanded = false;
    });
    beforeEach(clearAll);
    afterAll(clearAll);

    const composerID = 'composer-test-id';

    it('should render Addresses', async () => {
        const { getByText } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

        getByText(`${email1Name} <${email1}>`);
        getByText(`${email2Name} <${email2}>`);
    });

    it('should delete an address', async () => {
        const { getByTestId, getAllByTestId } = await mailTestRender(
            <AddressesEditor {...props} composerID={composerID} />,
            {
                onStore: (store) => {
                    setupComposer(store, composerID);
                },
            }
        );

        const displayedAddresses = getAllByTestId('composer-addresses-item');

        expect(displayedAddresses.length).toEqual(2);

        const email2RemoveButton = getByTestId(`remove-address-button-${email2}`);

        fireEvent.click(email2RemoveButton);

        const remainingAddresses = getAllByTestId('composer-addresses-item');
        expect(remainingAddresses.length).toEqual(1);
    });

    it.each`
        input                                     | expectedArray
        ${email3}                                 | ${[{ Name: email3, Address: email3 }]}
        ${`${email3}, ${email4}`}                 | ${[{ Name: email3, Address: email3 }, { Name: email4, Address: email4 }]}
        ${`${email3} ${email4}`}                  | ${[{ Name: email3, Address: email3 }, { Name: email4, Address: email4 }]}
        ${`${email3Name} <${email3}>`}            | ${[{ Name: email3Name, Address: email3 }]}
        ${`${email3Name} <${email3}>, ${email4}`} | ${[{ Name: email3Name, Address: email3 }, { Name: email4, Address: email4 }]}
        ${`${email3Name} <${email3}> ${email4}`}  | ${[{ Name: email3Name, Address: email3 }]}
    `(
        'should add correct addresses with the input "$input"',
        async ({ input, expectedArray }: { input: string; expectedArray: Recipient[] }) => {
            addApiMock('core/v4/keys/all', () => ({ Address: { Keys: [] } }));

            const { getAllByTestId, getByTestId } = await mailTestRender(
                <AddressesEditor {...props} composerID={composerID} />,
                {
                    onStore: (store) => {
                        setupComposer(store, composerID);
                    },
                }
            );

            const displayedAddresses = getAllByTestId('composer-addresses-item');

            expect(displayedAddresses.length).toEqual(2);

            const addressesInput = getByTestId('composer:to');

            fireEvent.change(addressesInput, { target: { value: input } });
            fireEvent.keyDown(addressesInput, { key: 'Enter' });

            const newAddresses = getAllByTestId('composer-addresses-item');
            expect(newAddresses.length).toEqual(2 + expectedArray.length);
        }
    );

    it('should edit an address on double click', async () => {
        const { getAllByTestId, getByText } = await mailTestRender(
            <AddressesEditor {...props} composerID={composerID} />,
            {
                onStore: (store) => {
                    setupComposer(store, composerID);
                },
            }
        );

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        const addressSpan = displayedAddresses[0];
        expect(addressSpan.getAttribute('contenteditable')).toEqual('false');

        fireEvent.dblClick(addressSpan);

        expect(addressSpan.getAttribute('contenteditable')).toEqual('true');

        fireEvent.change(addressSpan, {
            target: { innerHTML: email3 },
        });
        fireEvent.keyDown(addressSpan, { key: 'Enter' });

        getByText(email3);
        expect(addressSpan.getAttribute('contenteditable')).toEqual('false');
    });

    it('should open option dropdown', async () => {
        const { getAllByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

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

        const { getAllByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        const copyAddressButton = getByText(dropdown, 'Copy address');

        fireEvent.click(copyAddressButton);

        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should edit an address in option dropdown', async () => {
        const { getAllByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

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

        screen.getByText(email3);
    });

    it('should open create modal when clicking on create contact', async () => {
        addApiMock('contacts/v4/contacts', () => ({ Contacts: [] }));

        const { getAllByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        fireEvent.contextMenu(displayedAddresses[0]);

        const dropdown = await getDropdown();

        const createContactButton = getByText(dropdown, 'Create new contact');

        fireEvent.click(createContactButton);

        await tick();

        getByText(document.body, 'Create contact');
    });

    it('should delete an address in option modal', async () => {
        const { getAllByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

        const displayedAddresses = getAllByTestId('composer-addresses-item-label');

        expect(displayedAddresses.length).toEqual(2);

        const addressSpan = displayedAddresses[0];
        fireEvent.contextMenu(addressSpan);

        const dropdown = await getDropdown();

        const removeAddressButton = getByText(dropdown, 'Remove');

        fireEvent.click(removeAddressButton);

        const remainingAddresses = getAllByTestId('composer-addresses-item');
        expect(remainingAddresses.length).toEqual(1);
    });

    it('should not focus CC BCC or Insert contacts buttons', async () => {
        const { getByTestId } = await mailTestRender(<AddressesEditor {...props} composerID={composerID} />, {
            onStore: (store) => {
                setupComposer(store, composerID);
            },
        });

        const ccButton = getByTestId('composer:recipients:cc-button');
        const bccButton = getByTestId('composer:recipients:bcc-button');
        const insertContactsButton = getByTestId('composer:to-button');

        expect(ccButton.getAttribute('tabindex')).toEqual('-1');
        expect(bccButton.getAttribute('tabindex')).toEqual('-1');
        expect(insertContactsButton.getAttribute('tabindex')).toEqual('-1');
    });
});
