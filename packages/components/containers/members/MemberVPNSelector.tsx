import React from 'react';
import { range } from 'proton-shared/lib/helpers/array';
import { Option, SelectTwo } from '../../components';

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
    const options = range(min, max + step, step).map((value) => (
        <Option key={value} value={value} title={String(value)} />
    ));

    return (
        <SelectTwo value={value} onChange={({ value }) => onChange(value)}>
            {options}
        </SelectTwo>
    );
};

export default MemberVPNSelector;
