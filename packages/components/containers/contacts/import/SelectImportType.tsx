import React, { ChangeEvent } from 'react';
import { getAllTypes } from 'proton-shared/lib/contacts/helpers/types';

import { Label, Select } from '../../../components';

interface Props {
    field?: string;
    value: string;
    onChangeType: (type: string) => void;
}
const SelectImportType = ({ field = '', value, onChangeType }: Props) => {
    const types = getAllTypes();

    const handleChangeType = ({ target }: ChangeEvent<HTMLSelectElement>) => onChangeType(target.value);

    return (
        <Label className="pt0">
            <Select value={value} options={types[field as keyof typeof types]} onChange={handleChangeType} />
        </Label>
    );
};

export default SelectImportType;
