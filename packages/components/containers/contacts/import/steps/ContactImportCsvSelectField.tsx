import { getAllFields } from '@proton/shared/lib/helpers/contacts';

import { Label, Option, SelectTwo } from '../../../../components';
import { SelectChangeEvent } from '../../../../components/selectTwo/select';

interface Props {
    value?: string;
    disabled?: boolean;
    onChangeField?: (field: string) => void;
}
const ContactImportCsvSelectField = ({ value = '', disabled, onChangeField }: Props) => {
    const fields = getAllFields();

    const handleChangeField = ({ value }: SelectChangeEvent<string>) => onChangeField?.(value);

    return (
        <Label className="pt-0">
            <SelectTwo value={value} onChange={handleChangeField} disabled={disabled}>
                {fields.map((field) => (
                    <Option key={field.value} title={field.text} value={field.value} />
                ))}
            </SelectTwo>
        </Label>
    );
};

export default ContactImportCsvSelectField;
