import { getAllFields } from '@proton/shared/lib/helpers/contacts';

import { Label, Option, SelectTwo } from '../../../../components';
import { SelectChangeEvent } from '../../../../components/selectTwo/select';

interface Props {
    value?: string;
    disabled?: boolean;
    avoidFiltering?: boolean;
    onChangeField?: (field: string) => void;
}
const ContactImportCsvSelectField = ({ value = '', disabled, avoidFiltering, onChangeField }: Props) => {
    const fields = getAllFields();
    const filteredFields = fields.filter(({ value }) => {
        return value !== 'firstName' && value !== 'lastName';
    });

    const handleChangeField = ({ value }: SelectChangeEvent<string>) => {
        if (value === 'firstName' || value === 'lastName') {
            onChangeField?.('n');
        } else {
            onChangeField?.(value);
        }
    };

    return (
        <Label className="pt-0">
            <SelectTwo value={value} onChange={handleChangeField} disabled={disabled}>
                {(avoidFiltering ? fields : filteredFields).map((field) => (
                    <Option key={field.value} title={field.text} value={field.value} />
                ))}
            </SelectTwo>
        </Label>
    );
};

export default ContactImportCsvSelectField;
