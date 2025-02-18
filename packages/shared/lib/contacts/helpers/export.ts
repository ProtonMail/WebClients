import { format } from 'date-fns';

import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import uniqueBy from '@proton/utils/uniqueBy';

import { getContact, queryContactExport } from '../../api/contacts';
import downloadFile from '../../helpers/downloadFile';
import { wait } from '../../helpers/promise';
import type { Api, DecryptedKey } from '../../interfaces';
import type { Contact, ContactCard } from '../../interfaces/contacts/Contact';
import type { VCardContact } from '../../interfaces/contacts/VCard';
import { splitKeys } from '../../keys';
import { API_SAFE_INTERVAL, QUERY_EXPORT_MAX_PAGESIZE } from '../constants';
import { prepareVCardContact } from '../decrypt';
import { serialize } from '../vcard';

const MAX_SINGLE_CONTACTS_EXPORT = 300;

export const getFileName = (contact: VCardContact) => {
    // cover up for the case no FN is present in the contact (we can find such vcards in the DB)
    const contactName = contact.fn?.[0]?.value || '';
    const contactEmail = contact.email?.[0]?.value || '';
    const name = contactName || contactEmail;

    return `${name}-${format(Date.now(), 'yyyy-MM-dd')}.vcf`;
};

export const singleExport = (contact: VCardContact) => {
    const fileName = getFileName(contact);
    const vcard = serialize(contact);
    const blob = new Blob([vcard], { type: 'data:text/plain;charset=utf-8;' });

    downloadFile(blob, fileName);
};

export const exportContact = async (cards: ContactCard[], userKeys: DecryptedKey[]) => {
    const { publicKeys, privateKeys } = splitKeys(userKeys);

    const { vCardContact, errors = [] } = await prepareVCardContact({ Cards: cards } as Contact, {
        publicKeys,
        privateKeys,
    });

    if (errors.length) {
        throw new Error('Error decrypting contact');
    }

    const name = getFileName(vCardContact);

    return { name, vcard: serialize(vCardContact) };
};

/**
 * Exports contacts including api request and decryption
 * Beware it requires all contacts in //, don't use this for more than 10 contacts
 */
export const exportContacts = (contactIDs: string[], userKeys: DecryptedKey[], api: Api) =>
    Promise.all(
        contactIDs.map(async (contactID) => {
            const {
                Contact: { Cards },
            } = await api<{ Contact: Contact }>(getContact(contactID));
            return exportContact(Cards, userKeys);
        })
    );

/**
 * Export contacts from a labelID full featured with batch requests, callbacks, abort
 */
export const exportContactsFromLabel = async ({
    labelID,
    count,
    userKeys,
    signal,
    api,
    callbackSuccess,
    callbackFailure,
    contactIDs,
}: {
    labelID: string | undefined;
    count: number;
    userKeys: DecryptedKey[];
    signal: AbortSignal;
    api: Api;
    callbackSuccess: (contactContent: string) => void;
    callbackFailure: (contactID: string) => void;
    contactIDs?: string[];
}) => {
    const apiWithAbort = getApiWithAbort(api, signal);
    const apiCalls = Math.ceil(count / QUERY_EXPORT_MAX_PAGESIZE);
    const results = { success: [] as string[], failures: [] as string[] };

    for (let i = 0; i < apiCalls; i++) {
        let { Contacts: contacts } = (await apiWithAbort(
            queryContactExport({ LabelID: labelID, Page: i, PageSize: QUERY_EXPORT_MAX_PAGESIZE })
        )) as { Contacts: Contact[] };

        // API will respond one contact per email (unless fixed in the meantime)
        // We want to export each contact only once
        contacts = uniqueBy(contacts, (contact) => contact.ID);

        for (const { Cards, ID } of contacts) {
            if (signal.aborted) {
                return;
            }
            try {
                // If there is a selected ids list, return only the ones selected by the user
                // If there is none, we can return all contacts.
                if ((contactIDs && contactIDs.includes(ID)) || !contactIDs) {
                    const { vcard } = await exportContact(Cards, userKeys);

                    // need to check again for signal.aborted because the abort
                    // may have taken place during await prepareContact
                    if (!signal.aborted) {
                        callbackSuccess(vcard);
                    }

                    results.success.push(vcard);
                }
            } catch (error: any) {
                // need to check again for signal.aborted because the abort
                // may have taken place during await prepareContact
                if (!signal.aborted) {
                    callbackFailure(ID);
                }

                results.failures.push(ID);
            }
        }

        // avoid overloading API in the unlikely case exportBatch is too fast
        await wait(API_SAFE_INTERVAL);
    }

    return results;
};

/**
 * Export contacts from a list of contact ids, featured with batch requests, callbacks, abort
 */
export const exportContactsFromIds = async ({
    contactIDs,
    count,
    userKeys,
    signal,
    api,
    callbackSuccess,
    callbackFailure,
}: {
    contactIDs: string[];
    count: number;
    userKeys: DecryptedKey[];
    signal: AbortSignal;
    api: Api;
    callbackSuccess: (contactContent: string) => void;
    callbackFailure: (contactID: string) => void;
}) => {
    const isExportingAllContacts = contactIDs.length === count;
    // In some cases we need to get all contacts at once:
    // - If the user selected all contacts, we can export the full list
    // - If exporting too many contacts (but not the full list),
    //    we need to get them all and filter the ones selected by the user.
    //    Otherwise, if we're doing too many requests when getting contacts one by one,
    //    the user can encounter an error from the browser.
    if (contactIDs.length > MAX_SINGLE_CONTACTS_EXPORT || isExportingAllContacts) {
        return exportContactsFromLabel({
            labelID: undefined,
            count,
            userKeys,
            signal,
            api,
            callbackSuccess,
            callbackFailure,
            contactIDs,
        });
    } else {
        const apiWithAbort = getApiWithAbort(api, signal);
        const results = { success: [] as string[], failures: [] as string[] };

        contactIDs.forEach(async (contactID) => {
            const { Contact: contact } = await apiWithAbort<{ Contact: Contact }>(getContact(contactID));

            const { Cards, ID } = contact;

            if (signal.aborted) {
                return;
            }
            try {
                const { vcard } = await exportContact(Cards, userKeys);

                // need to check again for signal.aborted because the abort
                // may have taken place during await prepareContact
                if (!signal.aborted) {
                    callbackSuccess(vcard);
                }

                results.success.push(vcard);
            } catch (error: any) {
                // need to check again for signal.aborted because the abort
                // may have taken place during await prepareContact
                if (!signal.aborted) {
                    callbackFailure(ID);
                }

                results.failures.push(ID);
            }

            // avoid overloading API in the unlikely case exportBatch is too fast
            await wait(API_SAFE_INTERVAL);
        });

        return results;
    }
};
