import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import type { ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';
import { ImportFatalError } from '@proton/shared/lib/contacts/errors/ImportFatalError';
import type {
    EncryptedContact,
    ImportContactsModel,
    ImportedContact,
} from '@proton/shared/lib/interfaces/contacts/Import';
import { IMPORT_STEPS } from '@proton/shared/lib/interfaces/contacts/Import';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { DynamicProgress, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../../components';
import { useApi, useBeforeUnload, useEventManager, useGetUserKeys } from '../../../../hooks';
import { extractTotals, processContactsInBatches } from '../encryptAndSubmit';

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onClose?: () => void;
}
const ContactImporting = ({ model, setModel, onClose }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();

    useBeforeUnload(c('Alert').t`By leaving now, some contacts may not be imported`);

    const handleFinish = async (importedContacts: ImportedContact[]) => {
        setModel((model) => ({ ...model, importedContacts, step: IMPORT_STEPS.SUMMARY }));
        await call();
    };

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the import
        const abortController = new AbortController();
        const { signal } = abortController;

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
                const importedContacts = await processContactsInBatches({
                    contacts: model.parsedVcardContacts,
                    labels: CATEGORIES.IGNORE,
                    overwrite: OVERWRITE.OVERWRITE_CONTACT,
                    keyPair,
                    api: getApiWithAbort(api, signal),
                    signal,
                    onProgress: handleImportProgress,
                    isImport: true,
                });
                if (signal.aborted) {
                    return;
                }
                void handleFinish(importedContacts);
            } catch (error: any) {
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
                void handleFinish([]);
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
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4">
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" disabled type="submit">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default ContactImporting;
