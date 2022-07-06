import { Dispatch, FormEvent, SetStateAction } from 'react';

import { c, msgid } from 'ttag';

import { getImportCategoriesModel, haveCategories } from '@proton/shared/lib/contacts/helpers/import';
import { IMPORT_STEPS, ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';

import {
    Alert,
    Button,
    DynamicProgress,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../../../components';
import { useUser } from '../../../../hooks';
import { useGetContactGroups } from '../../../../hooks/useCategories';
import { extractTotals } from '../encryptAndSubmit';
import ContactImportWarningErrorDetails from './ContactImportWarningErrorDetails';

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

    let alertMessage;
    if (isSuccess) {
        alertMessage = c('Import contacts').ngettext(
            msgid`Contact successfully imported. The imported contact will now appear in your contact list.`,
            `Contacts successfully imported. The imported contacts will now appear in your contact list.`,
            totalImported
        );
    } else if (isPartialSuccess) {
        alertMessage = c('Import contacts')
            .t`An error occurred while encrypting and adding your contacts. ${totalImported} out of ${totalToImport} contacts successfully imported.`;
    } else {
        alertMessage = c('Import contact').ngettext(
            msgid`An error occurred while encrypting and adding your contact. No contact could be imported.`,
            `An error occurred while encrypting and adding your contacts. No contact could be imported.`,
            totalToImport
        );
    }

    const displayMessage =
        isPartialSuccess || isSuccess
            ? c('Import contact').ngettext(
                  msgid`${totalImported}/${totalToImport} contact encrypted and added to your contact list`,
                  `${totalImported}/${totalToImport} contacts encrypted and added to your contact list`,
                  totalToImport
              )
            : '';

    let type: 'info' | 'warning' | 'error';
    if (isSuccess) {
        type = 'info';
    } else if (isPartialSuccess) {
        type = 'warning';
    } else {
        type = 'error';
    }

    return (
        <form className="modal-two-dialog-container h100" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                <Alert className="mb1" type={type}>
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
                <Button color="norm" loading={model.loading} type="submit" className="mlauto">
                    {canImportGroups ? c('Action').t`Next` : c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </form>
    );
};

export default ContactImportSummary;
