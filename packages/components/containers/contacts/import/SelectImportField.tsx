import React, { ChangeEvent } from 'react';

import { getAllFields } from '@proton/shared/lib/helpers/contacts';

import { Label, Select } from '../../../components';

interface Props {
    value?: string;
    onChangeField: (field: string) => void;
}
const SelectImportField = ({ value = '', onChangeField }: Props) => {
    const fields = getAllFields();

    const handleChangeField = ({ target }: ChangeEvent<HTMLSelectElement>) => onChangeField(target.value);

    return (
        <Label className="pt0">
            <Select value={value} options={fields} onChange={handleChangeField} />
        </Label>
    );
};

export default SelectImportField;
