import React, { ChangeEvent } from 'react';
import { range } from 'proton-shared/lib/helpers/array';
import { GIGA } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Select } from '../../components';

export const getStorageRange = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 }
) => {
    return [
        Math.ceil(memberUsedSpace / GIGA) * GIGA,
        Math.floor((organizationMaxSpace - organizationAssignedSpace + memberMaxSpace) / GIGA) * GIGA,
    ];
};

interface Props {
    range: number[];
    step: number;
    value: number;
    onChange: (value: number) => void;
}
const MemberStorageSelector = ({ range: [min, max], step, value, onChange }: Props) => {
    const options = range(min, max + step, step).map((value) => ({ text: `${humanSize(value, 'GB')}`, value }));
    return (
        <Select
            value={value}
            options={options}
            onChange={({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value)}
        />
    );
};

export default MemberStorageSelector;
