import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';
import { GIGA } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';

export const getStorageRange = (
    { UsedSpace: memberUsedSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, UsedSpace: organizationUsedSpace = 0 }
) => {
    return [
        Math.ceil(memberUsedSpace / GIGA) * GIGA,
        Math.ceil((organizationMaxSpace - organizationUsedSpace + memberUsedSpace) / GIGA) * GIGA
    ];
};

const MemberStorageSelector = ({ range: [min, max], step, value, onChange }) => {
    const options = range(min, max + step, step).map((value) => ({ text: `${humanSize(value, 'GB')}`, value }));
    return <Select value={value} options={options} onChange={({ target }) => onChange(+target.value)} />;
};

MemberStorageSelector.propTypes = {
    range: PropTypes.array.isRequired,
    step: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default MemberStorageSelector;
