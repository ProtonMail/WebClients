import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

const MemberVPNSelector = ({ member, organization, onChange }) => {
    const step = 1;
    const minPadding = 0;
    const maxPadding = organization.MaxVPN - organization.UsedVPN + member.MaxVPN + step;
    const options = range(minPadding, maxPadding, step).map((value) => ({ text: value, value }));
    const [vpn, setVpn] = useState(member.ID ? member.MaxVPN : 1);
    const handleChange = ({ target }) => setVpn(target.value);

    useEffect(() => {
        onChange(vpn);
    }, [vpn]);

    return <Select value={vpn} options={options} onChange={handleChange} />;
};

MemberVPNSelector.propTypes = {
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    organization: PropTypes.object.isRequired
};

MemberVPNSelector.defaultProps = {
    member: {}
};

export default MemberVPNSelector;
