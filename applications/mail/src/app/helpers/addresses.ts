import { c } from 'ttag';
import { getEmailParts, normalizeEmail } from 'proton-shared/lib/helpers/email';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { RecipientGroup, RecipientOrGroup } from '../models/address';
import { Message } from '../models/message';
import { getContactsOfGroup, getContactOfRecipient } from './contacts';
import { Address, Key } from 'proton-shared/lib/interfaces';
import { unique } from 'proton-shared/lib/helpers/array';
import { isMessage } from './elements';
import { Element } from '../models/element';
import { Conversation } from '../models/conversation';
import { ADDRESS_STATUS } from 'proton-shared/lib/constants';

export const REGEX_RECIPIENT = /(.*?)\s*<([^>]*)>/;

export const removeDot = (email = '') => {
    const [localPart, domain] = getEmailParts(email);
    if (domain) {
        return `${localPart.replace(/\./g, '')}@${domain}`;
    }
    return email;
};

/**
 * Remove plus alias part present in the email value
 */
export const removeEmailAlias = (email = '') => {
    return normalizeEmail(email)
        .replace(/(\+[^@]*)@/, '@')
        .replace(/[._-](?=[^@]*@)/g, '');
};

export const cleanEmail = (email = '') => {
    return removeDot(removeEmailAlias(email));
};

/**
 * Add plus alias part for an email
 */
export const addPlusAlias = (email = '', plus = '') => {
    const atIndex = email.indexOf('@');
    const plusIndex = email.indexOf('+');

    if (atIndex === -1 || plusIndex > -1) {
        return email;
    }

    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex, email.length);

    return `${name}+${plus}${domain}`;
};

/**
 * Get address from email
 * Remove + alias and transform to lower case
 */
export const getByEmail = (addresses: Address[], email = '') => {
    const cleanEmail = removeEmailAlias(email);
    return addresses.find(({ Email }) => removeEmailAlias(Email) === cleanEmail);
};

/**
 * Check if the address is fallback (Can't receive but has keys)
 */
export const isFallbackAddress = (address?: Address, keys: Key[] = []) =>
    !!address && !address.Receive && !!keys.length;

export const isDirtyAddress = ({ Keys, Status }: Address) => !Keys.length || Status === ADDRESS_STATUS.STATUS_DISABLED;

export const isOwnAddress = (address?: Address, keys: Key[] = []) => !!address && !isFallbackAddress(address, keys);

export const inputToRecipient = (input: string): Recipient => {
    const match = REGEX_RECIPIENT.exec(input);

    if (match !== null) {
        return {
            Name: match[1],
            Address: match[2]
        };
    }
    return {
        Name: input,
        Address: input
    };
};

export const recipientToInput = (recipient: Partial<Recipient> = {}): string => {
    if (recipient.Address && recipient.Name && recipient.Address !== recipient.Name) {
        return `${recipient.Name} <${recipient.Address}>`;
    }

    if (recipient.Address === recipient.Name) {
        return recipient.Address || '';
    }

    return `${recipient.Name} ${recipient.Address}`;
};

export const contactToRecipient = (contact: Partial<ContactEmail> = {}, groupPath?: string): Partial<Recipient> => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath
});

export const majorToRecipient = (email: string) => ({
    Name: email,
    Address: email
});

export const contactToInput = (contact: Partial<ContactEmail> = {}): string =>
    recipientToInput(contactToRecipient(contact));

export const recipientsWithoutGroup = (recipients: Recipient[], groupPath?: string) =>
    recipients.filter((recipient) => recipient.Group !== groupPath);

export const getRecipientLabelDetailed = (recipient?: Recipient, allContacts?: ContactEmail[]) => {
    const { Name, Address } = recipient || {};
    const contact = getContactOfRecipient(allContacts, Address);
    if (contact) {
        return contact.Name;
    }
    if (Name) {
        return Name;
    }
    return Address;
};

export const getRecipientLabel = (recipient?: Recipient, allContacts?: ContactEmail[]) => {
    const { Name, Address } = recipient || {};
    const contact = getContactOfRecipient(allContacts, Address);
    if (contact) {
        return contact.Name;
    }
    if (!Name || Name === Address) {
        const index = Address?.indexOf('@') || -1;
        if (index === -1) {
            return Address;
        } else {
            return Address?.substring(0, index);
        }
    }
    if (Name) {
        return Name;
    }
    return '';
};

export const getRecipientGroupLabel = (recipientGroup?: RecipientGroup, contactsInGroup = 0) => {
    const count = recipientGroup?.recipients.length;
    const members = c('Info').t`Members`;
    return `${recipientGroup?.group?.Name} (${count}/${contactsInGroup} ${members})`;
};

export const getRecipientOrGroupLabel = ({ recipient, group }: RecipientOrGroup, allContacts: ContactEmail[]) =>
    recipient
        ? getRecipientLabel(recipient, allContacts)
        : getRecipientGroupLabel(group, getContactsOfGroup(allContacts, group?.group?.ID).length);

export const getRecipientOrGroupLabelDetailed = ({ recipient, group }: RecipientOrGroup, allContacts: ContactEmail[]) =>
    recipient
        ? getRecipientLabelDetailed(recipient, allContacts)
        : getRecipientGroupLabel(group, getContactsOfGroup(allContacts, group?.group?.ID).length);

export const recipientsToRecipientOrGroup = (recipients: Recipient[], groups: ContactGroup[]) =>
    recipients.reduce<RecipientOrGroup[]>((acc, value) => {
        if (value.Group) {
            const existingGroup = acc.find((recipientsOrGroup) => recipientsOrGroup.group?.group?.Path === value.Group);
            if (existingGroup) {
                existingGroup.group?.recipients.push(value);
            } else {
                const group = groups.find((group) => group.Path === value.Group);
                if (group) {
                    acc.push({ group: { group, recipients: [value] } });
                } else {
                    acc.push({ recipient: value });
                }
            }
        } else {
            acc.push({ recipient: value });
        }
        return acc;
    }, []);

/**
 * Detect if the email address is a valid plus alias and returns the address model appropriate
 */
export const getAddressFromPlusAlias = (addresses: Address[], email = ''): Address | undefined => {
    const plusIndex = email.indexOf('+');
    const atIndex = email.indexOf('@');

    if (plusIndex === -1 || atIndex === -1) {
        return;
    }

    // Remove the plus alias part to find a match with existing addresses
    const address = getByEmail(addresses, removeEmailAlias(email));
    const { Status, Receive, Send } = address || {};

    if (!Status || !Receive || !Send) {
        // pm.me addresses on free accounts (Send = 0)
        return;
    }

    const plusPart = email.substring(plusIndex + 1, atIndex);

    // Returns an address where the Email is build to respect the exising capitalization and add the plus part
    return { ...(address as Address), Email: addPlusAlias(address?.Email, plusPart) };
};

/**
 * Return list of addresses available in the FROM select
 * Reference: Angular/src/app/composer/factories/composerFromModel.js
 */
export const getFromAdresses = (addresses: Address[], originalTo = '') => {
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
    let recipients: Recipient[] = [];

    if (isMessage(element)) {
        const { ToList = [], CCList = [], BCCList = [], Sender = {} } = element as Message;
        recipients = [...ToList, ...CCList, ...BCCList, Sender];
    } else {
        const { Senders = [], Recipients = [] } = element as Conversation;
        recipients = [...Recipients, ...Senders];
    }

    return unique(recipients.map(({ Address }: Recipient) => removeEmailAlias(Address))).length;
};
