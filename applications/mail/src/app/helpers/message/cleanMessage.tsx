import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

/**
 * Remove duplicate recipients from a recipient list
 */
const uniqueRecipientList = (recipients: Recipient[]) => {
    const seenAddresses = new Set<string>();
    return recipients.reduce<Recipient[]>((acc, recipient) => {
        if (seenAddresses.has(recipient.Address)) {
            return acc;
        }
        seenAddresses.add(recipient.Address);
        acc.push(recipient);
        return acc;
    }, []);
};

/**
 * Remove duplicate emails from a message
 */
export const uniqueMessageRecipients = (message: Message) => {
    const newToList = uniqueRecipientList(message.ToList as Recipient[]);
    const newCCList = uniqueRecipientList(message.CCList as Recipient[]);
    const newBCCList = uniqueRecipientList(message.BCCList as Recipient[]);
    return { ...message, ToList: newToList, CCList: newCCList, BCCList: newBCCList };
};

export const removeMessageRecipients = (message: Message, emailAddresses: string[]) => {
    const newToList = message.ToList?.filter(({ Address }) => !emailAddresses?.includes(Address as string));
    const newCCList = message.CCList?.filter(({ Address }) => !emailAddresses?.includes(Address as string));
    const newBCCList = message.BCCList?.filter(({ Address }) => !emailAddresses?.includes(Address as string));
    return { ...message, ToList: newToList, CCList: newCCList, BCCList: newBCCList };
};
