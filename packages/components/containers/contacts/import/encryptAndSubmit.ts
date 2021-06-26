import { addContacts, labelContactEmails, labelContacts } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { createContactGroup } from '@proton/shared/lib/api/labels';
import { API_CODES, HOUR, LABEL_COLORS } from '@proton/shared/lib/constants';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareContact } from '@proton/shared/lib/contacts/encrypt';
import { getContactCategories, getContactEmails } from '@proton/shared/lib/contacts/properties';
import { chunk, uniqueBy } from '@proton/shared/lib/helpers/array';
import { noop, randomIntFromInterval } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api, KeyPair, Label, SimpleMap } from '@proton/shared/lib/interfaces';
import {
    ContactProperties,
    IMPORT_GROUPS_ACTION,
    ImportCategories,
    ImportedContact,
} from '@proton/shared/lib/interfaces/contacts';
import { getContactId, splitErrors, extractContactImportCategories } from '@proton/shared/lib/contacts/helpers/import';
import {
    AddContactsApiResponse,
    AddContactsApiResponses,
    EncryptedContact,
    ImportContactsModel,
} from '@proton/shared/lib/interfaces/contacts/Import';
import { IMPORT_CONTACT_ERROR_TYPE, ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;

const encryptContact = async (contact: ContactProperties, { privateKey, publicKey }: KeyPair) => {
    try {
        const contactEncrypted = await prepareContact(contact, { privateKey, publicKey });
        return {
            contact: contactEncrypted,
            contactId: getContactId(contact),
            contactEmails: getContactEmails(contact),
            categories: getContactCategories(contact),
        };
    } catch (error) {
        const contactId = getContactId(contact);
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.ENCRYPTION_ERROR, contactId);
    }
};

const submitContacts = async (contacts: EncryptedContact[], labels: CATEGORIES, overwrite: OVERWRITE, api: Api) => {
    // submit the data
    let responses: AddContactsApiResponse[] = [];
    try {
        const { Responses } = await api<AddContactsApiResponses>({
            ...addContacts({
                Contacts: contacts.map(({ contact }) => contact),
                Overwrite: overwrite,
                Labels: labels,
            }),
            timeout: HOUR,
            silence: true,
        });
        responses = Responses;
    } catch (error) {
        const { Code = 0, Error = error.message } = error.data || {};
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
    contacts: ContactProperties[];
    labels: CATEGORIES;
    overwrite: OVERWRITE;
    keyPair: KeyPair;
    api: Api;
    signal: AbortSignal;
    onProgress: (encrypted: EncryptedContact[], imported: ImportedContact[], errors: ImportContactError[]) => void;
}
export const processInBatches = async ({
    contacts,
    labels,
    overwrite,
    keyPair,
    api,
    signal,
    onProgress,
}: ProcessData) => {
    const batches = chunk(contacts, BATCH_SIZE);
    const promises = [];
    const imported: ImportedContact[][] = [];

    for (let i = 0; i < batches.length; i++) {
        // The API requests limit for the submit route are 100 calls per 10 seconds
        // We play it safe by enforcing a 100ms minimum wait between API calls. During this wait we encrypt the contacts
        if (signal.aborted) {
            return [];
        }
        const batchedContacts = batches[i];
        const [result] = await Promise.all([
            Promise.all(batchedContacts.map((contacts) => encryptContact(contacts, keyPair))),
            wait(100),
        ]);
        const { errors, rest: encrypted } = splitErrors(result);
        if (signal.aborted) {
            return [];
        }
        onProgress(encrypted, [], errors);
        if (encrypted.length) {
            const promise = submitContacts(encrypted, labels, overwrite, api).then(
                (result: (ImportedContact | ImportContactError)[]) => {
                    const { errors, rest: importedSuccess } = splitErrors(result);
                    imported.push(importedSuccess);
                    onProgress([], importedSuccess, errors);
                }
            );
            promises.push(promise);
        }
    }
    await Promise.all(promises);

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
                        Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
                    })
                );
                newLabelIDsMap[targetName] = ID;
            } catch (e) {
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
