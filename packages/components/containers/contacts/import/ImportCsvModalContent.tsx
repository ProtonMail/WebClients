import React, { useState, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';

import { ImportContactsModel } from 'proton-shared/lib/interfaces/contacts/Import';
import {
    modifyContactField,
    modifyContactType,
    toggleContactChecked,
} from 'proton-shared/lib/contacts/helpers/importCsv';

import { useNotifications } from '../../../hooks';
import { Table, Alert } from '../../../components';

import ImportCsvTableHeader from './ImportCsvTableHeader';
import ImportCsvTableBody from './ImportCsvTableBody';

interface Props {
    model: ImportContactsModel & Required<Pick<ImportContactsModel, 'preVcardsContacts'>>;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
}
const ImportCsvModalContent = ({ model, setModel }: Props) => {
    const { createNotification } = useNotifications();
    const [contactIndex, setContactIndex] = useState(0);

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

    return (
        <>
            <Alert>
                {c('Description of the purpose of the import CSV modal')
                    .t`We have detected the following fields in the CSV file you uploaded. Check the ones you want to import.`}
            </Alert>
            <Alert>
                {c('Description of the purpose of the import CSV modal')
                    .t`Also, we have automatically matched CSV fields with vCard fields. You can review and change this matching manually.`}
            </Alert>
            <Table>
                <ImportCsvTableHeader
                    disabledPrevious={contactIndex === 0}
                    disabledNext={preVcardsContacts.length === 0 || contactIndex + 1 === preVcardsContacts.length}
                    onNext={handleClickNext}
                    onPrevious={handleClickPrevious}
                />
                <ImportCsvTableBody
                    contact={preVcardsContacts && preVcardsContacts[contactIndex]}
                    onToggle={handleToggle}
                    onChangeField={handleChangeField}
                    onChangeType={handleChangeType}
                />
            </Table>
        </>
    );
};

export default ImportCsvModalContent;
