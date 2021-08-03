import { useEffect, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';

import {
    EncryptedContact,
    ImportedContact,
    IMPORT_STEPS,
    ImportContactsModel,
} from '@proton/shared/lib/interfaces/contacts/Import';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { OVERWRITE, CATEGORIES } from '@proton/shared/lib/contacts/constants';
import { ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';
import { ImportFatalError } from '@proton/shared/lib/contacts/errors/ImportFatalError';

import { useApi, useBeforeUnload, useGetUserKeys } from '../../../hooks';
import { Alert, DynamicProgress } from '../../../components';

import { extractTotals, processInBatches } from './encryptAndSubmit';

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onFinish: (contacts: ImportedContact[]) => Promise<void>;
}
const ImportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getUserKeys = useGetUserKeys();

    useBeforeUnload(c('Alert').t`By leaving now, some contacts may not be imported`);

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the import
        const abortController = new AbortController();
        const { signal } = abortController;

        const apiWithAbort: <T>(config: object) => Promise<T> = (config) => api({ ...config, signal });

        const setModelWithAbort = (set: (model: ImportContactsModel) => ImportContactsModel) => {
            if (signal.aborted) {
                return;
            }
            setModel(set);
        };

        const handleImportProgress = (
            encrypted: EncryptedContact[],
            imported: ImportedContact[],
            errors: ImportContactError[]
        ) => {
            setModelWithAbort((model) => ({
                ...model,
                totalEncrypted: model.totalEncrypted + encrypted.length,
                totalImported: model.totalImported + imported.length,
                importedContacts: [...model.importedContacts, ...imported],
                errors: [...model.errors, ...errors],
            }));
        };

        const process = async () => {
            try {
                const {
                    privateKeys: [privateKey],
                    publicKeys: [publicKey],
                } = splitKeys(await getUserKeys());
                const keyPair = { privateKey, publicKey };
                const importedContacts = await processInBatches({
                    contacts: model.parsedVcardContacts,
                    labels: CATEGORIES.IGNORE,
                    overwrite: OVERWRITE.OVERWRITE_CONTACT,
                    keyPair,
                    api: apiWithAbort,
                    signal,
                    onProgress: handleImportProgress,
                });
                if (signal.aborted) {
                    return;
                }
                void onFinish(importedContacts);
            } catch (error) {
                setModelWithAbort(() => ({
                    step: IMPORT_STEPS.ATTACHING,
                    parsedVcardContacts: [],
                    importedContacts: [],
                    totalEncrypted: 0,
                    totalImported: 0,
                    errors: [],
                    categories: [],
                    loading: false,
                    failure: new ImportFatalError(error),
                }));
                if (signal.aborted) {
                    return;
                }
                void onFinish([]);
            }
        };

        void process();

        return () => {
            abortController.abort();
        };
    }, []);

    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);

    return (
        <>
            <Alert>
                {c('Description')
                    .t`Encrypting and importing contacts... This may take a few minutes. When the process is completed, you can close this modal.`}
            </Alert>
            <DynamicProgress
                id="progress-import-contacts"
                value={totalProcessed}
                display={c('Import calendar').t`Encrypting and adding contacts: ${totalImported}/${totalToImport}`}
                max={totalToProcess}
                loading
            />
        </>
    );
};

export default ImportingModalContent;
