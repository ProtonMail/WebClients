import { addContacts, labelContactEmails, labelContacts } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { createContactGroup } from '@proton/shared/lib/api/labels';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { API_CODES, HOUR } from '@proton/shared/lib/constants';
import type { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';
import { IMPORT_CONTACT_ERROR_TYPE, ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';
import { extractContactImportCategories, getContactId, splitErrors } from '@proton/shared/lib/contacts/helpers/import';
import { getContactCategories, getContactEmails } from '@proton/shared/lib/contacts/properties';
import { prepareForSaving } from '@proton/shared/lib/contacts/surgery';
import { SentryCommonInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Api, KeyPair, Label, SimpleMap } from '@proton/shared/lib/interfaces';
import type { ImportCategories, ImportedContact } from '@proton/shared/lib/interfaces/contacts';
import { IMPORT_GROUPS_ACTION } from '@proton/shared/lib/interfaces/contacts';
import type {
    AddContactsApiResponse,
    AddContactsApiResponses,
} from '@proton/shared/lib/interfaces/contacts/ContactApi';
import type { EncryptedContact, ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import chunk from '@proton/utils/chunk';
import noop from '@proton/utils/noop';
import uniqueBy from '@proton/utils/uniqueBy';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;
// API limit is 100 calls per 10 seconds. We'll make batches of 10 requests (10 contacts per request),
// targeting a limit of 9req/s maximum to avoid the rate limit
const SUBMIT_CONCURRENCY = 10;
const MIN_GROUP_INTERVAL_MS = Math.ceil((SUBMIT_CONCURRENCY / 9) * 1000);

const encryptContact = async (contact: VCardContact, { privateKey, publicKey }: KeyPair) => {
    try {
        const prepared = prepareForSaving(contact);
        const contactEncrypted = await prepareVCardContact(prepared, { privateKey, publicKey });
        return {
            contact: contactEncrypted,
            contactId: getContactId(prepared),
            contactEmails: getContactEmails(prepared),
            categories: getContactCategories(prepared),
        };
    } catch (error: any) {
        const contactId = getContactId(contact);
        traceInitiativeError(SentryCommonInitiatives.CONTACT_IMPORT, error, { tags: { stage: 'encrypt' } });
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.ENCRYPTION_ERROR, contactId);
    }
};

const submitContacts = async ({
    contacts,
    labels,
    overwrite,
    api,
    isImport,
}: {
    contacts: EncryptedContact[];
    labels: CATEGORIES;
    overwrite: OVERWRITE;
    api: Api;
    isImport?: boolean;
}) => {
    // submit the data
    let responses: AddContactsApiResponse[] = [];
    try {
        const { Responses } = await api<AddContactsApiResponses>({
            ...addContacts({
                Contacts: contacts.map(({ contact }) => contact),
                Overwrite: overwrite,
                Labels: labels,
                Import: isImport ? 1 : 0,
            }),
            timeout: HOUR,
            silence: true,
        });
        responses = Responses;
    } catch (error: any) {
        const { Code = 0, Error = `${error}` } = error.data || {};
        responses = contacts.map((contact, index) => ({
            Index: index,
            Response: { Code, Error },
        }));
    }

    return responses.map((response) => {
        const {
            Index,
            Response: { Error: errorMessage, Code, Contact },
        } = response;
        if (Code !== SINGLE_SUCCESS || !Contact) {
            const error = new Error(errorMessage);
            const { contactId } = contacts[Index];
            return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
        }
        const contact = contacts[Index];
        return {
            contactID: Contact.ID,
            contactEmailIDs: Contact.ContactEmails.map((contactEmail) => contactEmail.ID),
            categories: extractContactImportCategories(Contact, contact),
        };
    });
};

interface ProcessData {
    contacts: VCardContact[];
    labels: CATEGORIES;
    overwrite: OVERWRITE;
    keyPair: KeyPair;
    api: Api;
    signal: AbortSignal;
    isImport?: boolean;
    onProgress: (encrypted: EncryptedContact[], imported: ImportedContact[], errors: ImportContactError[]) => void;
}

export const processContactsInBatches = async ({
    contacts,
    labels,
    overwrite,
    keyPair,
    api,
    signal,
    isImport,
    onProgress,
}: ProcessData) => {
    const batches = chunk(contacts, BATCH_SIZE);
    const batchGroups = chunk(batches, SUBMIT_CONCURRENCY);
    const imported: ImportedContact[][] = [];

    // To avoid the rate limit from the api (which is 100 requests in 10s), make batches of 10 requests.
    // In case the api is super fast, wait for the remaining time to prevent passing over this limit
    for (const batchGroup of batchGroups) {
        if (signal.aborted) {
            return [];
        }

        const results = await Promise.all(
            batchGroup.map(async (batch) => {
                const encryptedContacts = await Promise.all(batch.map((contact) => encryptContact(contact, keyPair)));

                const { errors: encryptErrors, rest: encrypted } = splitErrors(encryptedContacts);
                onProgress(encrypted, [], encryptErrors);

                if (!encrypted.length || signal.aborted) {
                    return [];
                }

                const submitResults = await submitContacts({ contacts: encrypted, labels, overwrite, isImport, api });
                const { errors: submitErrors, rest: importedSuccess } = splitErrors(submitResults);
                onProgress([], importedSuccess, submitErrors);
                return importedSuccess;
            })
        );

        imported.push(...results);

        // Always wait MIN_GROUP_INTERVAL_MS between groups regardless of how long the group took.
        // This prevents slow groups from consuming the timing buffer and causing the next group
        // to fire immediately, which would create back-to-back bursts that trigger 429s.
        await new Promise<void>((resolve) => setTimeout(resolve, MIN_GROUP_INTERVAL_MS));
    }

    return imported.flat();
};

export const submitCategories = async (categories: ImportCategories[], api: Api) => {
    // First create new contact groups if needed. Store label IDs in a map
    const newCategories = uniqueBy(
        categories.filter(({ action }) => action === IMPORT_GROUPS_ACTION.CREATE),
        ({ targetName }) => targetName
    );
    const newLabelIDsMap: SimpleMap<string> = {};
    const createRequests = newCategories.map(({ targetName }) => {
        return async () => {
            try {
                const {
                    Label: { ID },
                } = await api<{ Label: Label }>(
                    createContactGroup({
                        Name: targetName,
                        Color: getRandomAccentColor(),
                    })
                );
                newLabelIDsMap[targetName] = ID;
            } catch (e: any) {
                // let the process continue, but an error growler will be displayed
                noop();
            }
        };
    });
    // the routes called in requests do not have any specific jail limit
    // the limit per user session is 25k requests / 900s
    await processApiRequestsSafe(createRequests, 1000, 100 * 1000);
    // label contacts
    const labelRequests: (() => Promise<any>)[] = [];
    categories.forEach(({ action, targetGroup, targetName, contactEmailIDs, contactIDs }) => {
        if (action === IMPORT_GROUPS_ACTION.IGNORE) {
            return;
        }
        if (action === IMPORT_GROUPS_ACTION.MERGE) {
            const labelID = targetGroup.ID;
            if (contactEmailIDs.length) {
                labelRequests.push(() =>
                    api(labelContactEmails({ LabelID: labelID, ContactEmailIDs: contactEmailIDs })).catch(noop)
                );
            }
            if (contactIDs.length) {
                labelRequests.push(() => api(labelContacts({ LabelID: labelID, ContactIDs: contactIDs })).catch(noop));
            }
            return;
        }
        if (action === IMPORT_GROUPS_ACTION.CREATE) {
            const labelID = newLabelIDsMap[targetName];
            if (labelID && contactEmailIDs.length) {
                labelRequests.push(() =>
                    api(labelContactEmails({ LabelID: labelID, ContactEmailIDs: contactEmailIDs })).catch(noop)
                );
            }
            if (labelID && contactIDs.length) {
                labelRequests.push(() => api(labelContacts({ LabelID: labelID, ContactIDs: contactIDs })).catch(noop));
            }
        }
    });
    // the routes called in requests do not have any specific jail limit
    // the limit per user session is 25k requests / 900s
    return processApiRequestsSafe(labelRequests, 1000, 100 * 1000);
};

export const extractTotals = (model: ImportContactsModel) => {
    const { parsedVcardContacts, totalEncrypted, totalImported, errors } = model;
    const totalToImport = parsedVcardContacts.length;
    const totalToProcess = 2 * totalToImport; // count encryption and submission equivalently for the progress
    const totalErrors = errors.length;
    const totalProcessed = totalEncrypted + totalImported + totalErrors;
    return { totalToImport, totalToProcess, totalImported, totalProcessed };
};
