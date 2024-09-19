import Option from '@proton/components/components/option/Option';
import { getAllTypes } from '@proton/shared/lib/helpers/contacts';

import { Label, SelectTwo } from '../../../../components';
import type { SelectChangeEvent } from '../../../../components/selectTwo/select';

interface Props {
    field?: string;
    value: string;
    onChangeType: (type: string) => void;
}
const ContactImportCsvSelectType = ({ field = '', value, onChangeType }: Props) => {
    const types = getAllTypes();

    const handleChangeType = ({ value }: SelectChangeEvent<string>) => onChangeType(value);

    return (
        <Label className="pt-0">
            <SelectTwo value={value} onChange={handleChangeType}>
                {types[field as keyof typeof types].map((type) => (
                    <Option key={type.value} title={type.text} value={type.value} />
                ))}
            </SelectTwo>
        </Label>
    );
};

export default ContactImportCsvSelectType;
