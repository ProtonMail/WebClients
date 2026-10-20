import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { findSender } from '../message/messageRecipients';
import { textToHtml } from '../textToHtml';

export const plainTextToHTML = (
    message: Partial<Message> | undefined,
    plainTextContent: string | undefined,
    mailSettings: MailSettings | undefined,
    userSettings: UserSettings | undefined,
    addresses: Address[]
) => {
    const sender = findSender(addresses, message);
    return textToHtml(plainTextContent, sender?.Signature || '', mailSettings, userSettings);
};
