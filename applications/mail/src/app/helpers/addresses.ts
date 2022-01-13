import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { unique } from '@proton/shared/lib/helpers/array';
import { canonizeEmail, canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { c } from 'ttag';
import { getAddressFromPlusAlias, getByEmail } from '@proton/shared/lib/mail/addresses';
import { RecipientGroup, RecipientOrGroup } from '../models/address';
import { Conversation } from '../models/conversation';
import { Element } from '../models/element';
import { isMessage } from './elements';
import { ContactGroupsMap, ContactsMap } from '../logic/contacts/contactsTypes';

/**
 * Return the matching ContactEmail in the map taking care of email normalization
 */
export const getContactEmail = (contactsMap: ContactsMap, email: string | undefined) => {
    const normalizedEmail = canonizeEmail(email || '');
    return contactsMap[normalizedEmail];
};

/**
 * Check if the address is fallback (Can't receive but has keys)
 */
export const isFallbackAddress = (address?: Address, keys: Key[] = []) =>
    !!address && !address.Receive && !!keys.length;

export const isDirtyAddress = ({ Keys, Status }: Address) => !Keys.length || Status === ADDRESS_STATUS.STATUS_DISABLED;

export const isOwnAddress = (address?: Address, keys: Key[] = []) => !!address && !isFallbackAddress(address, keys);

export const isSelfAddress = (email: string | undefined, addresses: Address[]) =>
    !!addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizeInternalEmail(email || ''));

export const recipientsWithoutGroup = (recipients: Recipient[], groupPath?: string) =>
    recipients.filter((recipient) => recipient.Group !== groupPath);

export const getRecipientLabelDetailed = (recipient: Recipient, contactsMap: ContactsMap) => {
    const { Name, Address } = recipient || {};
    const contact = getContactEmail(contactsMap, Address);

    if (contact?.Name?.trim()) {
        return contact.Name;
    }
    if (Name) {
        return Name;
    }
    return Address;
};

export const getRecipientLabel = (recipient: Recipient, contactsMap: ContactsMap) => {
    const { Name, Address } = recipient || {};
    const contact = getContactEmail(contactsMap, Address);

    if (contact?.Name?.trim()) {
        return contact.Name;
    }
    if (!Name || Name === Address) {
        return Address;
    }
    if (Name) {
        return Name;
    }
    return '';
};

export const getRecipientGroupLabel = (recipientGroup?: RecipientGroup, contactsInGroup = 0) => {
    const count = recipientGroup?.recipients.length;

    /* translator: "members" is a part of a longer string used to display the number of contacts selected from a contact group
     * The final string looks like "${contactGroupName} (${numberOfSelectedContacts}/${numberOfContactsInGroup} members)"
     * Full sentence for reference: "Work (2/10 members)"
     */
    const members = c('Info').t`members`;
    return `${recipientGroup?.group?.Name} (${count}/${contactsInGroup} ${members})`;
};

export const recipientsToRecipientOrGroup = (recipients: Recipient[], contactGroupsMap?: ContactGroupsMap) =>
    recipients.reduce<RecipientOrGroup[]>((acc, value) => {
        if (value.Group) {
            const existingGroup = acc.find((recipientsOrGroup) => recipientsOrGroup.group?.group?.Path === value.Group);
            if (existingGroup) {
                existingGroup.group?.recipients.push(value);
            } else {
                if(contactGroupsMap) {
                    const group = contactGroupsMap[value.Group];
                    if (group) {
                        acc.push({ group: { group, recipients: [value] } });
                    } else {
                        acc.push({ recipient: value });
                    }
                } else {
                    acc.push({ recipient: value });
                }
            }
        } else {
            acc.push({ recipient: value });
        }
        return acc;
    }, []);

export const recipientOrGroupToRecipients = (recipientsOrGroups: RecipientOrGroup[]) =>
    recipientsOrGroups
        .map((recipientOrGroup) =>
            recipientOrGroup.recipient
                ? recipientOrGroup.recipient
                : (recipientOrGroup.group?.recipients as Recipient[])
        )
        .flat();

export const getRecipientOrGroupKey = (recipientOrGroup: RecipientOrGroup) =>
    recipientOrGroup.recipient ? recipientOrGroup.recipient.Address : recipientOrGroup.group?.group?.ID;

export const matchRecipientOrGroup = (rog1: RecipientOrGroup, rog2: RecipientOrGroup) =>
    getRecipientOrGroupKey(rog1) === getRecipientOrGroupKey(rog2);

/**
 * Get matching address for the email in the list dealing with potential plus aliases
 */
export const getAddressFromEmail = (addresses: Address[], email = '') => {
    const addressForPlusAlias = getAddressFromPlusAlias(addresses, email);

    if (addressForPlusAlias) {
        return addressForPlusAlias;
    }

    return getByEmail(addresses, email);
};

/**
 * Return list of addresses available in the FROM select
 * Reference: Angular/src/app/composer/factories/composerFromModel.js
 */
export const getFromAddresses = (addresses: Address[], originalTo = '') => {
    const result = addresses
        .filter(({ Status, Receive, Send }) => Status === 1 && Receive === 1 && Send === 1)
        .sort((a1, a2) => (a1.Order || 0) - (a2.Order || 0));

    const plusAddress = getAddressFromPlusAlias(addresses, originalTo);

    if (plusAddress) {
        // It's important to unshift the plus address to be found first with find()
        result.unshift(plusAddress);
    }

    return result;
};

/**
 * Get address to use as sender for a new draft
 */
export const getFromAddress = (addresses: Address[], originalTo = '', addressID: string | undefined) => {
    const fromAddresses = getFromAddresses(addresses, originalTo);
    return fromAddresses.find((address) => address.ID === addressID) || fromAddresses[0];
};

/**
 * Find the current sender for a message
 */
export const findSender = (
    addresses: Address[] = [],
    message?: Partial<Message>,
    ableToSend = false
): Address | undefined => {
    const enabledAddresses = addresses
        .filter((address) => address.Status === 1)
        .filter((address) => (ableToSend ? address.Send === 1 : true))
        .sort((a1, a2) => (a1.Order || 0) - (a2.Order || 0));

    if (message?.AddressID) {
        const originalAddress = enabledAddresses.find((address) => address.ID === message?.AddressID);
        if (originalAddress) {
            return originalAddress;
        }
    }

    return enabledAddresses[0];
};

export const getNumParticipants = (element: Element) => {
    let recipients: Recipient[];

    if (isMessage(element)) {
        const { ToList = [], CCList = [], BCCList = [], Sender = {} } = element as Message;
        recipients = [...ToList, ...CCList, ...BCCList, Sender as Recipient];
    } else {
        const { Senders = [], Recipients = [] } = element as Conversation;
        recipients = [...Recipients, ...Senders];
    }

    return unique(recipients.map(({ Address }: Recipient) => canonizeInternalEmail(Address))).length;
};
