import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Table from '@proton/components/components/table/Table';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ImportFatalError } from '@proton/shared/lib/contacts/errors/ImportFatalError';
import { toVCardContacts } from '@proton/shared/lib/contacts/helpers/csv';
import { getHasPreVcardsContacts } from '@proton/shared/lib/contacts/helpers/import';
import {
    modifyContactField,
    modifyContactType,
    toggleContactChecked,
} from '@proton/shared/lib/contacts/helpers/importCsv';
import type { ImportContactsModel, PreVcardsProperty } from '@proton/shared/lib/interfaces/contacts/Import';
import { IMPORT_STEPS } from '@proton/shared/lib/interfaces/contacts/Import';

import ContactImportCsvTableBody from './ContactImportCsvTableBody';
import ContactImportCsvTableHeader from './ContactImportCsvTableHeader';

// Helper function to find the index and check if it's still selected
const findCheckedIndex = (preVcards: PreVcardsProperty, headerName: string, index: number) => {
    const foundIndex = preVcards.findIndex(({ header }) => header.toLowerCase() === headerName.toLowerCase());
    const isChecked = foundIndex !== -1 && preVcards[foundIndex].checked;
    return isChecked && foundIndex !== index;
};

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
            const preVcards = preVcardsContacts[0][groupIndex];

            // Display name cannot be empty, so if no row is selected after the current update, prevent the action
            const isDisplayNameStillChecked = findCheckedIndex(preVcards, 'display name', index);
            const isFirstNameStillChecked = findCheckedIndex(preVcards, 'first name', index);
            const isLastNameStillChecked = findCheckedIndex(preVcards, 'last name', index);

            const isRowValid = isDisplayNameStillChecked || isFirstNameStillChecked || isLastNameStillChecked;

            if (!isRowValid) {
                return createNotification({
                    type: 'error',
                    text: c('Error notification').t`Display name cannot be empty`,
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
        event.stopPropagation();

        const { errors, rest: parsedVcardContacts } = toVCardContacts(model.preVcardsContacts || []);

        setModel({
            ...model,
            step: IMPORT_STEPS.IMPORTING,
            parsedVcardContacts,
            errors,
        });
    };

    return (
        <form className="modal-two-dialog-container h-full" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import contacts`} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Description of the purpose of the import CSV modal')
                        .t`We have detected the following fields in the CSV file you uploaded. Check the ones you want to import.`}
                </Alert>
                <Alert className="mb-4">
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
