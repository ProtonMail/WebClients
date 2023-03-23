import isTruthy from '@proton/utils/isTruthy';

import { validateEmailAddress } from '../helpers/email';
import { Recipient } from '../interfaces';
import { ContactEmail } from '../interfaces/contacts';
import { unescapeFromString } from '../sanitize/escape';

export const REGEX_RECIPIENT = /(.*?)\s*<([^>]*)>/;

const SEPARATOR_REGEX = /[,;]/;

/**
 * Trim and remove surrounding chevrons
 */
export const clearValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

/**
 * Split input content by comma or semicolon
 */
export const splitBySeparator = (input: string) => {
    return input
        .split(SEPARATOR_REGEX)
        .map((value) => clearValue(value))
        .filter(isTruthy);
};
/**
 * Find in a string potential recipients separated by a space
 */
export const findRecipientsWithSpaceSeparator = (input: string) => {
    // Do nothing if the input does not contain a space
    // Otherwise, executing the logic might break the behaviour we have
    // For example it will detect as valid input "address@pm.m", but the user might want to type "address@pm.me"
    if (!input.includes(' ')) {
        return [];
    }

    const emails = input.split(' ');

    const clearedEmails = emails.map((email) => email.trim()).filter((email) => email.length > 0);

    const isValid = clearedEmails.every((email) => validateEmailAddress(email));

    return isValid ? clearedEmails : [];
};

export const inputToRecipient = (input: string) => {
    // Remove potential unwanted HTML entities such as '&shy;' from the string
    const cleanInput = unescapeFromString(input);
    const trimmedInput = cleanInput.trim();
    const match = REGEX_RECIPIENT.exec(trimmedInput);

    if (match !== null && (match[1] || match[2])) {
        const trimmedMatches = match.map((match) => match.trim());
        return {
            Name: trimmedMatches[1],
            Address: trimmedMatches[2] || trimmedMatches[1],
        };
    }
    return {
        Name: trimmedInput,
        Address: trimmedInput,
    };
};

/**
 *  Used in AddressesAutocomplete and AddressesAutocomplete v2 to detect recipients strings inside the input
 */
export const handleRecipientInputChange = (
    newValue: string,
    hasEmailPasting: boolean,
    onAddRecipients: (recipients: Recipient[]) => void,
    setInput: (val: string) => void
) => {
    if (newValue === ';' || newValue === ',') {
        return;
    }

    if (!hasEmailPasting) {
        setInput(newValue);
        return;
    }

    const values = newValue.split(SEPARATOR_REGEX).map((value) => clearValue(value));
    if (values.length > 1) {
        onAddRecipients(values.map(inputToRecipient));
        setInput('');
        return;
    }

    // Try to find recipients with space separator e.g. "address1@pm.me address2@pm.me"
    const valuesWithSpaceBar = newValue.split(' ').map((val) => val.trim());
    if (valuesWithSpaceBar.length > 0) {
        const recipientsWithSpaceSeparator = findRecipientsWithSpaceSeparator(newValue);

        if (recipientsWithSpaceSeparator.length > 0) {
            onAddRecipients(recipientsWithSpaceSeparator.map(inputToRecipient));
            setInput('');
            return;
        }
    }

    setInput(newValue);
};

export const contactToRecipient = (contact: ContactEmail, groupPath?: string) => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath,
});

export const majorToRecipient = (email: string) => ({
    Name: email,
    Address: email,
});

export const recipientToInput = (recipient: Recipient): string => {
    if (recipient.Address && recipient.Name && recipient.Address !== recipient.Name) {
        return `${recipient.Name} <${recipient.Address}>`;
    }

    if (recipient.Address === recipient.Name) {
        return recipient.Address || '';
    }

    return `${recipient.Name} ${recipient.Address}`;
};

export const contactToInput = (contact: ContactEmail): string => recipientToInput(contactToRecipient(contact));
