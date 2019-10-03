import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

export const getVPNRange = (
    { MaxVPN: memberMaxVPN = 0 } = {},
    { UsedVPN: organizationUsedVPN = 0, MaxVPN: organizationMaxVPN = 0 }
) => {
    return [0, organizationMaxVPN - organizationUsedVPN + memberMaxVPN];
};

const MemberVPNSelector = ({ range: [min, max], step, value, onChange }) => {
    const options = range(min, max + step, step).map((value) => ({ text: value, value }));
    return <Select value={value} options={options} onChange={({ target }) => onChange(+target.value)} />;
};

MemberVPNSelector.propTypes = {
    range: PropTypes.array.isRequired,
    step: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default MemberVPNSelector;
