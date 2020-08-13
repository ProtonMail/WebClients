import React, { ChangeEvent } from 'react';
import { range } from 'proton-shared/lib/helpers/array';
import { Select } from '../../components';

export const getVPNRange = (
    { MaxVPN: memberMaxVPN = 0 } = {},
    { UsedVPN: organizationUsedVPN = 0, MaxVPN: organizationMaxVPN = 0 }
) => {
    return [0, organizationMaxVPN - organizationUsedVPN + memberMaxVPN];
};

interface Props {
    range: number[];
    step: number;
    value: number;
    onChange: (value: number) => void;
}
const MemberVPNSelector = ({ range: [min, max], step, value, onChange }: Props) => {
    const options = range(min, max + step, step).map((value) => ({ text: value, value }));
    return (
        <Select
            value={value}
            options={options}
            onChange={({ target }: ChangeEvent<HTMLSelectElement>) => onChange(+target.value)}
        />
    );
};

export default MemberVPNSelector;
