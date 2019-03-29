import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';
import { GIGA } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const FIVE_GIGA = 5 * GIGA;

const MemberStorageSelector = ({ member, organization, onChange }) => {
    const minPadding = 0;
    const maxPadding = organization.MaxSpace - organization.AssignedSpace;
    const startNewMember = maxPadding > FIVE_GIGA ? FIVE_GIGA : maxPadding;
    const options = range(minPadding, maxPadding, GIGA).map((value) => ({ text: `${humanSize(value, 'GB')}`, value }));
    const [storage, setStorage] = useState(member.ID ? member.MaxSpace : startNewMember);

    const handleChange = ({ target }) => {
        const newValue = target.value;
        setStorage(newValue);
        onChange(newValue);
    };

    return <Select value={storage} options={options} onChange={handleChange} />;
};

MemberStorageSelector.propTypes = {
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    organization: PropTypes.object.isRequired
};

MemberStorageSelector.defaultProps = {
    member: {}
};

export default MemberStorageSelector;
