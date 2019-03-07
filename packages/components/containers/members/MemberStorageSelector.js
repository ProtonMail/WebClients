import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';
import { BASE_SIZE } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const GIGA = BASE_SIZE ** 3;
const FIVE_GIGA = 5 * GIGA;

const MemberStorageSelector = ({ member, organization, onChange }) => {
    const minPadding = 0;
    const maxPadding = organization.MaxSpace - organization.AssignedSpace;
    const startNewMember = maxPadding > FIVE_GIGA ? FIVE_GIGA : maxPadding;
    const options = range(minPadding, maxPadding, GIGA).map((value) => ({ text: `${humanSize(value, 'GB')}`, value }));
    const [storage, setStorage] = useState(member.ID ? member.MaxSpace : startNewMember);
    const handleChange = ({ target }) => setStorage(target.value);

    useEffect(() => {
        onChange(storage);
    }, storage);

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
