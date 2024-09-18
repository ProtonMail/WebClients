import Checkbox from '@proton/components/components/input/Checkbox';
import type { ContactValue } from '@proton/shared/lib/interfaces/contacts';
import type { PreVcardsProperty } from '@proton/shared/lib/interfaces/contacts/Import';

import ContactImportCsvSelectField from './ContactImportCsvSelectField';

interface Props {
    preVcards: PreVcardsProperty;
    onToggle: (index: number) => void;
}

const RowDisplay = ({
    checked,
    onToggle,
    header,
    value,
    selectValue,
}: {
    checked: boolean;
    onToggle: () => void;
    header: string;
    value: ContactValue;
    selectValue: 'firstName' | 'lastName';
}) => {
    return (
        <tr key={selectValue}>
            <td className="text-center">
                <Checkbox checked={checked} onChange={onToggle} />
            </td>
            <td>{header}</td>
            <td>
                <div className="flex">
                    <ContactImportCsvSelectField value={selectValue} disabled avoidFiltering />
                </div>
            </td>
            <td className="text-ellipsis" title={value.toString()}>
                {checked && value}
            </td>
        </tr>
    );
};

// The N field is a special case, it contains two values: firstName and lastName
// other values are not supported (additional name, prefix, suffix)

// We override the default behavior of ContactImportCsvTableRows
// to display two fields instead of one to support first and last name
const ContactImportCsvTableRowsNField = ({ preVcards, onToggle }: Props) => {
    const firstName = preVcards.find(({ header }) => header === 'First Name');
    const lastName = preVcards.find(({ header }) => header === 'Last Name');

    return (
        <>
            {firstName ? (
                <RowDisplay
                    selectValue="firstName"
                    checked={firstName.checked}
                    onToggle={() => onToggle(0)}
                    header={firstName.header}
                    value={firstName.value}
                />
            ) : null}
            {lastName ? (
                <RowDisplay
                    selectValue="lastName"
                    checked={lastName.checked}
                    onToggle={() => onToggle(1)}
                    header={lastName.header}
                    value={lastName.value}
                />
            ) : null}
        </>
    );
};

export default ContactImportCsvTableRowsNField;
