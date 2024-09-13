import { useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import DynamicProgress from '@proton/components/components/progress/DynamicProgress';
import { useLoading } from '@proton/hooks';
import { addContacts, deleteContacts, getContact } from '@proton/shared/lib/api/contacts';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { API_CODES } from '@proton/shared/lib/constants';
import { ADD_CONTACTS_MAX_SIZE, API_SAFE_INTERVAL, CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareVCardContact as decrypt } from '@proton/shared/lib/contacts/decrypt';
import { prepareVCardContact as encrypt } from '@proton/shared/lib/contacts/encrypt';
import { splitEncryptedContacts } from '@proton/shared/lib/contacts/helpers/import';
import { merge } from '@proton/shared/lib/contacts/helpers/merge';
import { combineProgress } from '@proton/shared/lib/contacts/helpers/progress';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Contact as ContactType, SimpleEncryptedContact } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import chunk from '@proton/utils/chunk';

import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useApi, useUserKeys } from '../../../hooks';

const { OVERWRITE_CONTACT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

type Signal = { signal: AbortSignal };

interface Props {
    alreadyMerged?: VCardContact;
    mergeFinished: boolean;
    onFinish: () => void;
    onMerged?: () => void;
    onClose?: () => void;
    beMergedModel: { [ID: string]: string[] };
    beDeletedModel: { [ID: string]: string };
    totalBeMerged: number;
    totalBeDeleted: number;
}

const ContactMergingContent = ({
    alreadyMerged,
    mergeFinished,
    onFinish,
    onMerged,
    onClose,
    beMergedModel = {},
    beDeletedModel = {},
    totalBeMerged = 0,
    totalBeDeleted = 0,
}: Props) => {
    const api = useApi();
    const [userKeysList] = useUserKeys();
    const { privateKeys, publicKeys } = useMemo(() => splitKeys(userKeysList), [userKeysList]);

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

    const isDeleteOnly = totalBeMerged <= 0 && totalBeDeleted > 0;

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the merge
        const abortController = new AbortController();
        const apiWithAbort = getApiWithAbort(api, abortController.signal);

        /**
         * Get a contact from its ID and decrypt it. Return contact as a list of properties
         */
        const getDecryptedContact = async (ID: string, { signal }: Signal): Promise<VCardContact> => {
            if (signal.aborted) {
                return { fn: [] };
            }
            const { Contact } = await apiWithAbort<{ Contact: ContactType }>(getContact(ID));
            const { vCardContact, errors: contactErrors } = await decrypt(Contact, {
                privateKeys,
                publicKeys,
            });
            if (contactErrors.length) {
                throw new Error(`Error decrypting contact ${ID}`);
            }
            return vCardContact;
        };

        /**
         * Get and decrypt a group of contacts to be merged. Return array of decrypted contacts
         */
        const getDecryptedGroup = (groupIDs: string[] = [], { signal }: Signal) => {
            return processApiRequestsSafe(
                groupIDs.map((ID) => () => getDecryptedContact(ID, { signal })),
                3,
                1000
            );
        };

        /**
         * Encrypt a contact already merged. Useful for the case of `preview merge`
         */
        const encryptAlreadyMerged = async ({ signal }: Signal) => {
            if (signal.aborted) {
                return [];
            }
            // beMergedModel only contains one entry in this case
            const [[beMergedID, groupIDs]] = Object.entries(beMergedModel);
            const beSubmittedContacts: SimpleEncryptedContact[] = [];
            if (!alreadyMerged) {
                throw new Error('Contact already merged is undefined');
            }
            try {
                const encryptedMergedContact = await encrypt(alreadyMerged, {
                    privateKey: privateKeys[0],
                    publicKey: publicKeys[0],
                });
                beSubmittedContacts.push({ contact: encryptedMergedContact, contactId: beMergedID });

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
            const beSubmittedContacts: SimpleEncryptedContact[] = [];
            for (const [beMergedID, groupIDs] of Object.entries(beMergedModel)) {
                if (signal.aborted) {
                    return [];
                }
                try {
                    const decryptedGroup = await getDecryptedGroup(groupIDs, { signal });
                    const encryptedMergedContact = await encrypt(merge(decryptedGroup), {
                        privateKey: privateKeys[0],
                        publicKey: publicKeys[0],
                    });
                    beSubmittedContacts.push({ contact: encryptedMergedContact, contactId: beMergedID });
                    if (!signal.aborted) {
                        setModel((model) => ({
                            ...model,
                            mergedAndEncrypted: [...model.mergedAndEncrypted, ...groupIDs],
                        }));
                    }
                } catch (error) {
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
            { contacts = [], labels }: { contacts: SimpleEncryptedContact[]; labels: number },
            { signal }: Signal
        ) => {
            if (signal.aborted || !contacts.length) {
                return;
            }
            const beDeletedBatchIDs = [];
            const responses = (
                await apiWithAbort<{ Responses: { Response: { Code: number; Contact?: ContactType } }[] }>(
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

            for (const [index, { Code }] of responses.entries()) {
                const ID = contacts[index].contactId;
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
            { contacts = [], labels }: { contacts: SimpleEncryptedContact[]; labels: number },
            { signal }: Signal
        ) => {
            if (signal.aborted) {
                return;
            }
            // divide contacts and indexMap in batches
            const contactBatches = chunk(contacts, ADD_CONTACTS_MAX_SIZE);
            const apiCalls = contactBatches.length;

            for (let i = 0; i < apiCalls; i++) {
                // avoid overloading API in the case submitBatch is too fast
                await Promise.all([
                    submitBatch({ contacts: contactBatches[i], labels }, { signal }),
                    // tripling the safe interval as there are reports of hitting jails on production (the proper solution would be a dynamic rate)
                    wait(3 * API_SAFE_INTERVAL),
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

    let endMessage;
    if (successDelete && !successMerge) {
        endMessage = c('Progress bar description').ngettext(
            msgid`${model.deleted.length} out of ${totalBeDeleted} contact successfully deleted.`,
            `${model.deleted.length} out of ${totalBeDeleted} contacts successfully deleted.`,
            totalBeDeleted
        );
    } else if (successMerge) {
        endMessage = c('Progress bar description').ngettext(
            msgid`${model.submitted.length} out of ${totalBeMerged} contact successfully merged.`,
            `${model.submitted.length} out of ${totalBeMerged} contacts successfully merged.`,
            totalBeMerged
        );
    } else {
        endMessage = c('Progress bar description').t`No contacts merged.`;
    }

    return (
        <>
            <ModalTwoHeader title={isDeleteOnly ? c('Title').t`Deleting contacts` : c('Title').t`Merging contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4">
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
                    data-testid="merge-model:progress-merge-contacts"
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                {!mergeFinished && <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>}
                <Button
                    color="norm"
                    loading={!mergeFinished}
                    onClick={onMerged}
                    data-testid="merge-model:close-button"
                    className="ml-auto"
                >
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default ContactMergingContent;
