import { c, msgid } from 'ttag';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { isBlockedIncomingDefaultAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import type { Address, IncomingDefault, Recipient } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isSent, isSentAndReceived } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import type { RecipientGroup, RecipientOrGroup } from '../../models/address';
import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import type { ContactGroupsMap, ContactsMap } from '../../store/contacts/contactsTypes';
import { isSelfAddress } from '../addresses';
import { isElementConversation, isElementMessage } from '../elements';

/**
 * Return the matching ContactEmail in the map taking care of email normalization
 */
export const getContactEmail = (contactsMap: ContactsMap, email: string | undefined) => {
    const normalizedEmail = canonicalizeEmail(email || '');
    return contactsMap[normalizedEmail];
};

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

export const getRecipientGroupLabel = (recipientGroup?: RecipientGroup, contactsInGroup = 0, isShortName = false) => {
    const count = recipientGroup?.recipients.length || 0;

    if (isShortName) {
        if (count === contactsInGroup) {
            return `${recipientGroup?.group?.Name} (${contactsInGroup})`;
        }
        return `${recipientGroup?.group?.Name} (${count}/${contactsInGroup})`;
    }

    // Copy variables to give explicit naming in the translation string
    const contactGroupName = recipientGroup?.group?.Name || '';
    const numberOfSelectedContacts = count;
    const numberOfContactsInGroup = contactsInGroup;

    // translator: The final string looks like "Work (2/10 members)"
    return c('Info').ngettext(
        msgid`${contactGroupName} (${numberOfSelectedContacts}/${numberOfContactsInGroup} member)`,
        `${contactGroupName} (${numberOfSelectedContacts}/${numberOfContactsInGroup} members)`,
        numberOfContactsInGroup
    );
};

export const recipientsToRecipientOrGroup = (
    recipients: Recipient[],
    contactGroupsMap?: ContactGroupsMap,
    alwaysShowRecipients: boolean = false
) =>
    recipients.reduce<RecipientOrGroup[]>((acc, value) => {
        if (value.Group && !alwaysShowRecipients) {
            const existingGroup = acc.find((recipientsOrGroup) => recipientsOrGroup.group?.group?.Path === value.Group);
            if (existingGroup) {
                existingGroup.group?.recipients.push(value);
            } else {
                if (contactGroupsMap) {
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
            // Show recipient if no group is set or when we force the recipient display (e.g. print modal)
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

    if (isElementMessage(element)) {
        const { ToList = [], CCList = [], BCCList = [], Sender = {} } = element;
        recipients = [...ToList, ...CCList, ...BCCList, Sender as Recipient];
    } else {
        const { Senders = [], Recipients = [] } = element as Conversation;
        recipients = [...Recipients, ...Senders];
    }

    return unique(recipients.map(({ Address }: Recipient) => canonicalizeInternalEmail(Address))).length;
};

export const getSendersToBlock = (
    elements: Element[],
    incomingDefaultsAddresses: IncomingDefault[],
    addresses: Address[]
) => {
    const allSenders: Recipient[] = [];

    // Get all senders without duplicates
    elements.forEach((element) => {
        if (isElementConversation(element)) {
            element?.Senders?.map((sender) => {
                if (sender && allSenders.every((s) => s.Address !== sender.Address)) {
                    allSenders.push(sender);
                }
            });
        } else {
            const sender = (element as Message).Sender;
            if (sender && allSenders.every((s) => s.Address !== sender.Address)) {
                allSenders.push(element.Sender);
            }
        }
    }, []);

    // Remove self and blocked addresses
    return allSenders
        .filter((sender) => {
            if (sender) {
                const isSenderBlocked = isBlockedIncomingDefaultAddress(incomingDefaultsAddresses, sender.Address);
                const isSenderSelfAddress = isSelfAddress(sender.Address, addresses);

                return !isSenderBlocked && !isSenderSelfAddress;
            }
            return;
        })
        .filter(isTruthy);
};

export const getRecipients = (referenceMessage: MessageState, action: MESSAGE_ACTIONS, addresses: Address[]) => {
    const { data } = referenceMessage;

    const toList = data?.ToList || [];
    const replyTos = data?.ReplyTos || [];
    const ccList = data?.CCList || [];
    const bccList = data?.BCCList || [];

    let returnToList: Recipient[] = [];
    let returnCCList: Recipient[] = [];
    let returnBCCList: Recipient[] = [];

    if (action === MESSAGE_ACTIONS.REPLY) {
        if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
            returnToList = [...toList];
        } else {
            returnToList = [...replyTos];
        }
    } else {
        if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
            returnToList = [...toList];
            returnCCList = [...ccList];
            returnBCCList = [...bccList];
        } else {
            // Remove user address in CCList and ToList
            const userAddresses = addresses.map(({ Email = '' }) => canonicalizeInternalEmail(Email));
            const CCListAll: Recipient[] = unique([...(toList || []), ...(ccList || [])]);
            const CCList = CCListAll.filter(
                ({ Address = '' }) => !userAddresses.includes(canonicalizeInternalEmail(Address))
            );

            returnToList = [...replyTos];
            returnCCList = [...CCList];
        }
    }
    return { ToList: returnToList, CCList: returnCCList, BCCList: returnBCCList };
};

export const getReplyRecipientListAsString = (
    referenceMessage: MessageState,
    action: MESSAGE_ACTIONS,
    addresses: Address[],
    contactsMap: ContactsMap
) => {
    const getContactLabel = (recipientList: Recipient[]) => {
        return recipientList.map((recipient) => getRecipientLabel(recipient, contactsMap));
    };

    const { ToList, CCList, BCCList } = getRecipients(referenceMessage, action, addresses);

    const recipientList = getContactLabel([...ToList, ...CCList, ...BCCList]);

    let recipientAsString = '';
    recipientList.forEach((recipient, index) => {
        const isLastElement = index === recipientList.length - 1;
        recipientAsString = isLastElement ? `${recipientAsString}${recipient}` : `${recipientAsString}${recipient}, `;
    });

    return recipientAsString;
};
