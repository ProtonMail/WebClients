import { PreVcardsContact } from '@proton/shared/lib/interfaces/contacts/Import';

import ContactImportCsvTableRows from './ContactImportCsvTableRows';

interface Props {
    contact?: PreVcardsContact;
    onToggle: (groupIndex: number) => (index: number) => void;
    onChangeField: (groupIndex: number) => (field: string) => void;
    onChangeType: (groupIndex: number) => (type: string) => void;
}
const ContactImportCsvTableBody = ({ contact, onToggle, onChangeField, onChangeType }: Props) => {
    return (
        <tbody>
            {contact &&
                contact.map((preVcards, i) => (
                    <ContactImportCsvTableRows
                        key={`${preVcards[0].header}${i.toString()}`}
                        preVcards={preVcards}
                        onToggle={onToggle(i)}
                        onChangeField={onChangeField(i)}
                        onChangeType={onChangeType(i)}
                    />
                ))}
        </tbody>
    );
};

export default ContactImportCsvTableBody;
