import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { getImportCategoriesModel, haveCategories } from '@proton/shared/lib/contacts/helpers/import';
import type { ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';
import { IMPORT_STEPS } from '@proton/shared/lib/interfaces/contacts/Import';

import { DynamicProgress, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../../components';
import { useUser } from '../../../../hooks';
import { useGetContactGroups } from '../../../../hooks/useCategories';
import { extractTotals } from '../encryptAndSubmit';
import ContactImportWarningErrorDetails from './ContactImportWarningErrorDetails';

interface GetMessageParams {
    isSuccess: boolean;
    isPartialSuccess: boolean;
    totalImported: number;
    totalToImport: number;
}

const getAlertMessage = ({ isSuccess, isPartialSuccess, totalImported, totalToImport }: GetMessageParams) => {
    if (isSuccess) {
        return totalImported === 1
            ? c('Import contact')
                  .t`Contact successfully imported. The imported contact will now appear in your contact list.`
            : // translator: "Contacts" below is meant as multiple (more than one) contacts generically. The exact number of contacts imported is mentioned elsewhere
              c('Import contact')
                  .t`Contacts successfully imported. The imported contacts will now appear in your contact list.`;
    }
    if (isPartialSuccess) {
        return c('Import contact')
            .t`An error occurred while encrypting and adding your contacts. ${totalImported} out of ${totalToImport} contacts successfully imported.`;
    }
    return totalImported === 1
        ? c('Import contact')
              .t`An error occurred while encrypting and adding your contact. No contact could be imported.`
        : // translator: "Contacts" below is meant as multiple (more than one) contacts generically. The exact number of contacts we tried to import is mentioned elsewhere
          c('Import contact')
              .t`An error occurred while encrypting and adding your contacts. No contact could be imported.`;
};

const getDisplayMessage = ({ isSuccess, isPartialSuccess, totalImported, totalToImport }: GetMessageParams) => {
    if (!isSuccess && !isPartialSuccess) {
        return '';
    }
    return c('Import contact').ngettext(
        msgid`${totalImported}/${totalToImport} contact encrypted and added to your contact list`,
        `${totalImported}/${totalToImport} contacts encrypted and added to your contact list`,
        totalToImport
    );
};

const getAlertType = ({ isSuccess, isPartialSuccess }: Pick<GetMessageParams, 'isSuccess' | 'isPartialSuccess'>) => {
    if (isSuccess) {
        return 'info';
    }
    if (isPartialSuccess) {
        return 'warning';
    }
    return 'error';
};

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onClose?: () => void;
}
const ContactImportSummary = ({ model, setModel, onClose }: Props) => {
    const [user] = useUser();
    const getContactGroups = useGetContactGroups();

    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);
    const isSuccess = totalImported === totalToImport;
    const isPartialSuccess = totalImported > 0 && !isSuccess;
    const canImportGroups = haveCategories(model.importedContacts) && user.hasPaidMail;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (canImportGroups) {
            setModel((model) => ({ ...model, loading: true }));
            const contactGroups = await getContactGroups();
            setModel((model) => ({
                ...model,
                step: IMPORT_STEPS.IMPORT_GROUPS,
                loading: false,
                contactGroups,
                categories: getImportCategoriesModel(model.importedContacts, contactGroups),
            }));
        } else {
            onClose?.();
        }
    };

    const alertMessage = getAlertMessage({ isSuccess, isPartialSuccess, totalImported, totalToImport });
    const displayMessage = getDisplayMessage({ isSuccess, isPartialSuccess, totalImported, totalToImport });
    const alertType = getAlertType({ isSuccess, isPartialSuccess });

    return (
        <form className="modal-two-dialog-container h-full" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4" type={alertType}>
                    {alertMessage}
                </Alert>
                <DynamicProgress
                    id="progress-import-contacts"
                    value={totalProcessed}
                    display={displayMessage}
                    max={totalToProcess}
                    loading={false}
                    success={isSuccess}
                    partialSuccess={isPartialSuccess}
                />
                <ContactImportWarningErrorDetails errors={model.errors} />
            </ModalTwoContent>
            <ModalTwoFooter>
                {canImportGroups ? <Button onClick={onClose}>{c('Action').t`Close`}</Button> : null}
                <Button color="norm" loading={model.loading} type="submit" className="ml-auto">
                    {canImportGroups ? c('Action').t`Next` : c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </form>
    );
};

export default ContactImportSummary;
