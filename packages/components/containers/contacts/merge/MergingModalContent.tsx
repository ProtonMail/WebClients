import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import React, { useState, useEffect, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { getContact, addContacts, deleteContacts } from '@proton/shared/lib/api/contacts';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { wait } from '@proton/shared/lib/helpers/promise';
import { chunk } from '@proton/shared/lib/helpers/array';
import { prepareContact as decrypt } from '@proton/shared/lib/contacts/decrypt';
import { prepareContact as encrypt } from '@proton/shared/lib/contacts/encrypt';
import { API_CODES } from '@proton/shared/lib/constants';
import { API_SAFE_INTERVAL, ADD_CONTACTS_MAX_SIZE, OVERWRITE, CATEGORIES } from '@proton/shared/lib/contacts/constants';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Contact as ContactType, ContactProperties } from '@proton/shared/lib/interfaces/contacts';
import { merge } from '@proton/shared/lib/contacts/helpers/merge';
import { splitEncryptedContacts } from '@proton/shared/lib/contacts/helpers/import';
import { combineProgress } from '@proton/shared/lib/contacts/helpers/progress';
import { EncryptedContact } from '@proton/shared/lib/interfaces/contacts/Import';

import { Alert, DynamicProgress } from '../../../components';
import { useApi, useLoading } from '../../../hooks';

const { OVERWRITE_CONTACT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

type Signal = { signal: AbortSignal };

interface Props {
    userKeysList: DecryptedKey[];
    alreadyMerged?: ContactProperties;
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
    totalBeMerged: number;
    totalBeDeleted: number;
    onFinish: () => void;
}

const MergingModalContent = ({
    userKeysList,
    alreadyMerged,
    beMergedModel = {},
    beDeletedModel = {},
    totalBeMerged = 0,
    totalBeDeleted = 0,
    onFinish,
}: Props) => {
    const api = useApi();
    const { privateKeys, publicKeys } = useMemo(() => splitKeys(userKeysList), []);

    const [loading, withLoading] = useLoading(true);
    const [model, setModel] = useState<{
        mergedAndEncrypted: string[];
        failedOnMergeAndEncrypt: string[];
        submitted: string[];
        failedOnSubmit: string[];
        deleted: string[];
    }>({
        mergedAndEncrypted: [],
        failedOnMergeAndEncrypt: [],
        submitted: [],
        failedOnSubmit: [],
        deleted: [],
    });

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the merge
        const abortController = new AbortController();
        const apiWithAbort = (config: object) => api({ ...config, signal: abortController.signal }) as Promise<any>;

        /**
         * Get a contact from its ID and decrypt it. Return contact as a list of properties
         */
        const getDecryptedContact = async (ID: string, { signal }: Signal): Promise<ContactProperties> => {
            if (signal.aborted) {
                return [];
            }
            const { Contact } = (await apiWithAbort(getContact(ID))) as { Contact: ContactType };
            const { properties, errors: contactErrors } = await decrypt(Contact, {
                privateKeys,
                publicKeys,
            });
            if (contactErrors.length) {
                throw new Error(`Error decrypting contact ${ID}`);
            }
            return properties;
        };

        /**
         * Get and decrypt a group of contacts to be merged. Return array of decrypted contacts
         */
        const getDecryptedGroup = (groupIDs: string[] = [], { signal }: Signal) => {
            return processApiRequestsSafe(groupIDs.map((ID) => () => getDecryptedContact(ID, { signal })));
        };

        /**
         * Encrypt a contact already merged. Useful for the case of `preview merge`
         */
        const encryptAlreadyMerged = async ({ signal }: Signal) => {
            if (signal.aborted) {
                return [];
            }
            // beMergedModel only contains one entry in this case
            const [groupIDs] = Object.values(beMergedModel);
            const beSubmittedContacts: EncryptedContact[] = [];
            try {
                const encryptedMergedContact = await encrypt(alreadyMerged as ContactProperties, {
                    privateKey: privateKeys[0],
                    publicKey: publicKeys[0],
                });
                beSubmittedContacts.push({ contact: encryptedMergedContact } as EncryptedContact);

                if (!signal.aborted) {
                    setModel((model) => ({ ...model, mergedAndEncrypted: [...model.mergedAndEncrypted, ...groupIDs] }));
                }
            } catch {
                if (!signal.aborted) {
                    setModel((model) => ({
                        ...model,
                        failedOnMergeAndEncrypt: [...model.failedOnMergeAndEncrypt, ...groupIDs],
                    }));
                }
            }
            return beSubmittedContacts;
        };

        /**
         * Merge groups of contacts characterized by their ID. Return the encrypted merged contacts
         * to be submitted plus the IDs of the contacts to be deleted after the merge
         */
        const mergeAndEncrypt = async ({ signal }: Signal) => {
            const beSubmittedContacts: EncryptedContact[] = [];
            for (const groupIDs of Object.values(beMergedModel)) {
                if (signal.aborted) {
                    return [];
                }
                try {
                    const decryptedGroup = await getDecryptedGroup(groupIDs, { signal });
                    const encryptedMergedContact = await encrypt(merge(decryptedGroup), {
                        privateKey: privateKeys[0],
                        publicKey: publicKeys[0],
                    });
                    beSubmittedContacts.push({ contact: encryptedMergedContact } as EncryptedContact);
                    if (!signal.aborted) {
                        setModel((model) => ({
                            ...model,
                            mergedAndEncrypted: [...model.mergedAndEncrypted, ...groupIDs],
                        }));
                    }
                } catch {
                    if (!signal.aborted) {
                        setModel((model) => ({
                            ...model,
                            failedOnMergeAndEncrypt: [...model.failedOnMergeAndEncrypt, ...groupIDs],
                        }));
                    }
                }
            }
            return beSubmittedContacts;
        };

        /**
         * Submit a batch of merged contacts to the API
         */
        const submitBatch = async (
            { contacts = [], labels }: { contacts: EncryptedContact[]; labels: number },
            { signal }: Signal
        ) => {
            if (signal.aborted || !contacts.length) {
                return;
            }
            const beDeletedBatchIDs = [];
            const responses = (
                await apiWithAbort(
                    addContacts({
                        Contacts: contacts.map(({ contact }) => contact),
                        Overwrite: OVERWRITE_CONTACT,
                        Labels: labels,
                    })
                )
            ).Responses.map(({ Response }: any) => Response);

            if (signal.aborted) {
                return;
            }

            for (const {
                Code,
                Contact: { ID },
            } of responses) {
                const groupIDs = beMergedModel[ID];
                const beDeletedAfterMergeIDs = groupIDs.slice(1);
                if (Code === SINGLE_SUCCESS) {
                    if (!signal.aborted) {
                        setModel((model) => ({ ...model, submitted: [...model.submitted, ...groupIDs] }));
                    }
                    beDeletedBatchIDs.push(...beDeletedAfterMergeIDs);
                } else if (!signal.aborted) {
                    setModel((model) => ({ ...model, failedOnSubmit: [...model.failedOnSubmit, ...groupIDs] }));
                }
            }
            if (!signal.aborted && !!beDeletedBatchIDs.length) {
                await apiWithAbort(deleteContacts(beDeletedBatchIDs));
            }
        };

        /**
         * Submit all merged contacts to the API
         */
        const submitContacts = async (
            { contacts = [], labels }: { contacts: EncryptedContact[]; labels: number },
            { signal }: Signal
        ) => {
            if (signal.aborted) {
                return;
            }
            // divide contacts and indexMap in batches
            const contactBatches = chunk(contacts, ADD_CONTACTS_MAX_SIZE);
            const apiCalls = contactBatches.length;

            for (let i = 0; i < apiCalls; i++) {
                // avoid overloading API in the unlikely case submitBatch is too fast
                await Promise.all([
                    submitBatch({ contacts: contactBatches[i], labels }, { signal }),
                    wait(API_SAFE_INTERVAL),
                ]);
            }
        };

        /**
         * Delete contacts marked for deletion
         */
        const deleteMarkedForDeletion = async ({ signal }: Signal) => {
            const beDeletedIDs = Object.keys(beDeletedModel);
            if (!signal.aborted && !!beDeletedIDs.length) {
                setModel((model) => ({ ...model, deleted: [...model.deleted, ...beDeletedIDs] }));
                await apiWithAbort(deleteContacts(beDeletedIDs));
            }
        };

        /**
         * All steps of the merge process
         */
        const mergeContacts = async ({ signal }: Signal) => {
            const beSubmittedContacts = !alreadyMerged
                ? await mergeAndEncrypt({ signal })
                : await encryptAlreadyMerged({ signal });
            const { withCategories, withoutCategories } = splitEncryptedContacts(beSubmittedContacts);
            await submitContacts({ contacts: withCategories, labels: INCLUDE }, { signal });
            await submitContacts({ contacts: withoutCategories, labels: IGNORE }, { signal });
            await deleteMarkedForDeletion({ signal });
            if (!signal.aborted) {
                onFinish();
            }
        };

        void withLoading(mergeContacts(abortController));

        return () => {
            abortController.abort();
        };
    }, []);

    // Allocate 90% of the progress to merging and encrypting, 10% to sending to API
    const combinedProgress = combineProgress([
        {
            allocated: 0.9,
            successful: model.mergedAndEncrypted.length,
            failed: model.failedOnMergeAndEncrypt.length,
            total: totalBeMerged,
        },
        {
            allocated: 0.1,
            successful: model.submitted.length,
            failed: model.failedOnSubmit.length,
            total: totalBeMerged - model.failedOnMergeAndEncrypt.length,
        },
    ]);
    const successDelete = model.deleted.length === totalBeDeleted;
    const successMerge = model.failedOnMergeAndEncrypt.length + model.failedOnSubmit.length !== totalBeMerged;

    const progressMessage = c('Progress bar description').t`Progress: ${combinedProgress}%`;

    const endMessage =
        successDelete && !successMerge
            ? c('Progress bar description').ngettext(
                  msgid`${model.deleted.length} out of ${totalBeDeleted} contact successfully deleted.`,
                  `${model.deleted.length} out of ${totalBeDeleted} contacts successfully deleted.`,
                  totalBeDeleted
              )
            : successMerge
            ? c('Progress bar description').ngettext(
                  msgid`${model.submitted.length} out of ${totalBeMerged} contact successfully merged.`,
                  `${model.submitted.length} out of ${totalBeMerged} contacts successfully merged.`,
                  totalBeMerged
              )
            : c('Progress bar description').t`No contacts merged.`;

    return (
        <>
            <Alert>
                {totalBeMerged > 0
                    ? c('Description')
                          .t`Merging contacts... This may take a few minutes. When the process is completed, you can close this modal.`
                    : c('Description')
                          .t`Deleting contacts... This may take a few minutes. When the process is completed, you can close this modal.`}
            </Alert>
            <DynamicProgress
                id="progress-merge-contacts"
                loading={loading}
                value={combinedProgress}
                max={100}
                success={successMerge || successDelete}
                display={loading ? progressMessage : endMessage}
            />
        </>
    );
};

export default MergingModalContent;
