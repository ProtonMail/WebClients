import { addContacts } from 'proton-shared/lib/api/contacts';
import { API_CODES, HOUR } from 'proton-shared/lib/constants';
import { CATEGORIES, OVERWRITE } from 'proton-shared/lib/contacts/constants';
import { prepareContact } from 'proton-shared/lib/contacts/encrypt';
import { chunk } from 'proton-shared/lib/helpers/array';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Api, KeyPair } from 'proton-shared/lib/interfaces';
import { ContactProperties } from 'proton-shared/lib/interfaces/contacts';
import { getContactId, splitErrors } from 'proton-shared/lib/contacts/helpers/import';
import {
    AddContactsApiResponse,
    AddContactsApiResponses,
    EncryptedContact,
    ImportContactsModel,
} from 'proton-shared/lib/interfaces/contacts/Import';
import { IMPORT_CONTACT_ERROR_TYPE, ImportContactError } from 'proton-shared/lib/contacts/errors/ImportContactError';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;

const encryptContact = async (contact: ContactProperties, { privateKey, publicKey }: KeyPair) => {
    try {
        const contactEncrypted = await prepareContact(contact, { privateKey, publicKey });
        return { contact: contactEncrypted, contactId: getContactId(contact) };
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

    return responses.map((response): EncryptedContact | ImportContactError => {
        const {
            Index,
            Response: { Error: errorMessage, Code },
        } = response;
        if (Code === SINGLE_SUCCESS) {
            return contacts[Index];
        }
        const error = new Error(errorMessage);
        const { contactId } = contacts[Index];
        return new ImportContactError(IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR, contactId, error);
    });
};

interface ProcessData {
    contacts: ContactProperties[];
    labels: CATEGORIES;
    overwrite: OVERWRITE;
    keyPair: KeyPair;
    api: Api;
    signal: AbortSignal;
    onProgress: (encrypted: EncryptedContact[], imported: EncryptedContact[], errors: ImportContactError[]) => void;
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
    const imported: EncryptedContact[][] = [];

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
                (result: (EncryptedContact | ImportContactError)[]) => {
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

export const extractTotals = (model: ImportContactsModel) => {
    const { parsedVcardContacts, totalEncrypted, totalImported, errors } = model;
    const totalToImport = parsedVcardContacts.length;
    const totalToProcess = 2 * totalToImport; // count encryption and submission equivalently for the progress
    const totalErrors = errors.length;
    const totalProcessed = totalEncrypted + totalImported + totalErrors;
    return { totalToImport, totalToProcess, totalImported, totalProcessed };
};
