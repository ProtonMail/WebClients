import Checkbox from '@proton/components/components/input/Checkbox';
import { toVCard } from '@proton/shared/lib/contacts/helpers/csv';
import { display as getDisplay } from '@proton/shared/lib/contacts/helpers/csvFormat';
import type { PreVcardsProperty } from '@proton/shared/lib/interfaces/contacts/Import';

import ContactImportCsvSelectField from './ContactImportCsvSelectField';
import ContactImportCsvSelectType from './ContactImportCsvSelectType';
import ContactImportCsvTableRowsNField from './ContactImportCsvTableRowsNField';

interface Props {
    preVcards: PreVcardsProperty;
    onToggle: (index: number) => void;
    onChangeField: (field: string) => void;
    onChangeType: (type: string) => void;
}

const ContactImportCsvTableRows = ({ preVcards, onToggle, onChangeField, onChangeType }: Props) => {
    const { field, params } = toVCard(preVcards) || {};
    const display = preVcards[0]?.custom ? getDisplay.custom(preVcards) : getDisplay[field as string](preVcards);

    if (field === 'categories') {
        // Do not display CATEGORIES vcard fields since they cannot be edited from the contact modal
        return null;
    }

    return (
        <>
            {field === 'n' ? (
                <ContactImportCsvTableRowsNField preVcards={preVcards} onToggle={onToggle} />
            ) : (
                preVcards.map(({ checked, header }, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                        <td className="text-center">
                            <Checkbox checked={checked} onChange={() => onToggle(i)} />
                        </td>
                        <td>{header}</td>
                        {i === 0 ? (
                            <>
                                <td rowSpan={preVcards.length}>
                                    <div className="flex">
                                        <ContactImportCsvSelectField value={field} onChangeField={onChangeField} />
                                        {params?.type !== undefined ? (
                                            <ContactImportCsvSelectType
                                                field={field}
                                                value={params.type}
                                                onChangeType={onChangeType}
                                            />
                                        ) : null}
                                    </div>
                                </td>
                                <td rowSpan={preVcards.length} className="text-ellipsis" title={display}>
                                    {display}
                                </td>
                            </>
                        ) : null}
                    </tr>
                ))
            )}
        </>
    );
};

export default ContactImportCsvTableRows;
