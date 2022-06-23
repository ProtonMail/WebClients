import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { c } from 'ttag';
import { ImportContactsModel, IMPORT_STEPS } from '@proton/shared/lib/interfaces/contacts/Import';
import {
    modifyContactField,
    modifyContactType,
    toggleContactChecked,
} from '@proton/shared/lib/contacts/helpers/importCsv';
import { toVCardContacts } from '@proton/shared/lib/contacts/helpers/csv';
import { getHasPreVcardsContacts } from '@proton/shared/lib/contacts/helpers/import';
import { ImportFatalError } from '@proton/shared/lib/contacts/errors/ImportFatalError';
import { useNotifications } from '../../../../hooks';
import { Table, Alert, ModalTwoHeader, ModalTwoContent, ModalTwoFooter, Button } from '../../../../components';
import ContactImportCsvTableHeader from './ContactImportCsvTableHeader';
import ContactImportCsvTableBody from './ContactImportCsvTableBody';

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onClose?: () => void;
}
const ImportCsvModalContent = ({ model, setModel, onClose }: Props) => {
    const { createNotification } = useNotifications();
    const [contactIndex, setContactIndex] = useState(0);

    if (!getHasPreVcardsContacts(model)) {
        throw new ImportFatalError(new Error('No CSV contacts found'));
    }

    const { preVcardsContacts } = model;

    const handleClickPrevious = () => setContactIndex((index) => index - 1);
    const handleClickNext = () => setContactIndex((index) => index + 1);

    const handleToggle = (groupIndex: number) => (index: number) => {
        if (preVcardsContacts[0][groupIndex][index].combineInto === 'fn-main') {
            // do not allow to uncheck first name and last name simultaneously
            const preVcards = preVcardsContacts[0][groupIndex];
            const firstNameIndex = preVcards.findIndex(({ header }) => header.toLowerCase() === 'first name');
            const lastNameIndex = preVcards.findIndex(({ header }) => header.toLowerCase() === 'last name');
            const isFirstNameChecked = firstNameIndex !== -1 && preVcards[firstNameIndex].checked;
            const isLastNameChecked = lastNameIndex !== -1 && preVcards[lastNameIndex].checked;

            if ((!isFirstNameChecked && index === lastNameIndex) || (!isLastNameChecked && index === firstNameIndex)) {
                return createNotification({
                    type: 'error',
                    text: c('Error notification').t`First name and last name cannot be unchecked at the same time`,
                });
            }
        }
        setModel({
            ...model,
            preVcardsContacts: preVcardsContacts.map((contact) => toggleContactChecked(contact, [groupIndex, index])),
        });
    };

    const handleChangeField = (groupIndex: number) => (newField: string) =>
        setModel({
            ...model,
            preVcardsContacts: preVcardsContacts.map((contact) => modifyContactField(contact, groupIndex, newField)),
        });

    const handleChangeType = (groupIndex: number) => (newType: string) =>
        setModel({
            ...model,
            preVcardsContacts: preVcardsContacts.map((contact) => modifyContactType(contact, groupIndex, newType)),
        });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        setModel({
            ...model,
            step: IMPORT_STEPS.IMPORTING,
            parsedVcardContacts: toVCardContacts(model.preVcardsContacts || []),
            errors: [],
        });
    };

    return (
        <form className="modal-two-dialog-container h100" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                <Alert className="mb1">
                    {c('Description of the purpose of the import CSV modal')
                        .t`We have detected the following fields in the CSV file you uploaded. Check the ones you want to import.`}
                </Alert>
                <Alert className="mb1">
                    {c('Description of the purpose of the import CSV modal')
                        .t`Also, we have automatically matched CSV fields with vCard fields. You can review and change this matching manually.`}
                </Alert>
                <Table>
                    <ContactImportCsvTableHeader
                        disabledPrevious={contactIndex === 0}
                        disabledNext={preVcardsContacts.length === 0 || contactIndex + 1 === preVcardsContacts.length}
                        onNext={handleClickNext}
                        onPrevious={handleClickPrevious}
                    />
                    <ContactImportCsvTableBody
                        contact={preVcardsContacts && preVcardsContacts[contactIndex]}
                        onToggle={handleToggle}
                        onChangeField={handleChangeField}
                        onChangeType={handleChangeType}
                    />
                </Table>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" disabled={!model.preVcardsContacts?.length} type="submit">
                    {c('Action').t`Import`}
                </Button>
            </ModalTwoFooter>
        </form>
    );
};

export default ImportCsvModalContent;
