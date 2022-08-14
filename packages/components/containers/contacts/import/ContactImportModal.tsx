import { useState } from 'react';

import { IMPORT_STEPS, ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';

import { ModalProps, ModalTwo } from '../../../components';
import ContactImportAttaching from './steps/ContactImportAttaching';
import ContactImportCsv from './steps/ContactImportCsv';
import ContactImportGroups from './steps/ContactImportGroups';
import ContactImportSummary from './steps/ContactImportSummary';
import ContactImportWarning from './steps/ContactImportWarning';
import ContactImporting from './steps/ContactImporting';

export const getInitialState = (): ImportContactsModel => ({
    step: IMPORT_STEPS.ATTACHING,
    parsedVcardContacts: [],
    importedContacts: [],
    totalEncrypted: 0,
    totalImported: 0,
    errors: [],
    categories: [],
    loading: false,
});

interface Props extends ModalProps {}

const ContactImportModal = ({ ...rest }: Props) => {
    const [model, setModel] = useState<ImportContactsModel>(getInitialState());

    let ModalContent;
    if (model.step <= IMPORT_STEPS.ATTACHED) {
        ModalContent = ContactImportAttaching;
    } else if (model.step === IMPORT_STEPS.IMPORT_CSV) {
        ModalContent = ContactImportCsv;
    } else if (model.step <= IMPORT_STEPS.WARNING) {
        ModalContent = ContactImportWarning;
    } else if (model.step === IMPORT_STEPS.IMPORTING) {
        ModalContent = ContactImporting;
    } else if (model.step === IMPORT_STEPS.SUMMARY) {
        ModalContent = ContactImportSummary;
    } else {
        ModalContent = ContactImportGroups;
    }

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalContent model={model} setModel={setModel} onClose={rest.onClose} />
        </ModalTwo>
    );
};

export default ContactImportModal;
