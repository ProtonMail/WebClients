import { c } from 'ttag';

import { CONTACT_CARD_TYPE } from '../../constants';
import isTruthy from '../../helpers/isTruthy';
import { ContactProperties } from '../../interfaces/contacts';
import {
    ACCEPTED_EXTENSIONS,
    EncryptedContact,
    EXTENSION,
    ImportContactsModel,
} from '../../interfaces/contacts/Import';

import { hasCategories } from '../properties';
import { parse as parseVcard } from '../vcard';

import { IMPORT_CONTACT_ERROR_TYPE, ImportContactError } from '../errors/ImportContactError';

export const getIsAcceptedExtension = (extension: string): extension is ACCEPTED_EXTENSIONS => {
    return Object.values(EXTENSION).includes(extension as EXTENSION);
};

export const getHasPreVcardsContacts = (
    model: ImportContactsModel
): model is ImportContactsModel & Required<Pick<ImportContactsModel, 'preVcardsContacts'>> => {
    return !!model.preVcardsContacts;
};

/**
 * Try to get a string that identifies a contact. This will be used in case of errors
 */
export const getContactId = (vcardOrContactProperties: string | ContactProperties) => {
    if (Array.isArray(vcardOrContactProperties)) {
        const fn = vcardOrContactProperties.filter(({ field }) => field === 'fn')[0]?.value;
        if (fn) {
            return fn as string;
        }
        const email = vcardOrContactProperties.filter(({ field }) => field === 'email')[0]?.value;
        if (email) {
            return email as string;
        }
        return c('Import contact. Contact identifier').t`unknown`;
    }
    // try to get the name of the contact from FN, which is a required field in a vcard
    const [, fn] = vcardOrContactProperties.match(/FN(?:;[^\r\n]*)*:([^\r\n]*)\s/) || [];
    if (fn) {
        return fn;
    }
    return c('Import contact. Contact identifier').t`unknown`;
};

export const getSupportedContact = (vcard: string) => {
    if (vcard.includes('VERSION:2.1')) {
        const contactId = getContactId(vcard);
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.UNSUPPORTED_VCARD_VERSION, contactId);
    }
    try {
        return parseVcard(vcard);
    } catch (error) {
        const contactId = getContactId(vcard);
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
    }
};

export const getSupportedContacts = (vcards: string[]) => {
    return vcards
        .map((vcard) => {
            try {
                return getSupportedContact(vcard);
            } catch (error) {
                if (error instanceof ImportContactError) {
                    return error;
                }
                const contactId = getContactId(vcard);
                return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
            }
        })
        .filter(isTruthy);
};

export const splitErrors = <T>(contacts: (T | ImportContactError)[]) => {
    return contacts.reduce<{ errors: ImportContactError[]; rest: T[] }>(
        (acc, contact) => {
            if (contact instanceof ImportContactError) {
                acc.errors.push(contact);
            } else {
                acc.rest.push(contact);
            }
            return acc;
        },
        { errors: [], rest: [] }
    );
};

/**
 * Split contacts depending on having the CATEGORIES property.
 * @param contacts
 */
export const splitContacts = (contacts: ContactProperties[] = []) =>
    contacts.reduce<{ withCategories: ContactProperties[]; withoutCategories: ContactProperties[] }>(
        (acc, contact) => {
            if (hasCategories(contact)) {
                acc.withCategories.push(contact);
            } else {
                acc.withoutCategories.push(contact);
            }
            return acc;
        },
        { withCategories: [], withoutCategories: [] }
    );

/**
 * Split encrypted contacts depending on having the CATEGORIES property.
 */
export const splitEncryptedContacts = (contacts: EncryptedContact[] = []) =>
    contacts.reduce<{ withCategories: EncryptedContact[]; withoutCategories: EncryptedContact[] }>(
        (acc, contact) => {
            const {
                contact: { Cards, error },
            } = contact;
            if (error) {
                return acc;
            }
            if (Cards.some(({ Type, Data }) => Type === CONTACT_CARD_TYPE.CLEAR_TEXT && Data.includes('CATEGORIES'))) {
                acc.withCategories.push(contact);
            } else {
                acc.withoutCategories.push(contact);
            }
            return acc;
        },
        { withCategories: [], withoutCategories: [] }
    );
