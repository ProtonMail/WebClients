import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

const MemberVPNSelector = ({ member, organization, onChange }) => {
    const minPadding = member.MaxVPN || 0;
    const maxPadding = member.ID
        ? organization.MaxVPN - organization.UsedVPN + member.MaxVPN
        : organization.MaxVPN - organization.UsedVPN;
    const options = range(minPadding, maxPadding).map((value) => ({ text: value, value }));
    const [vpn, setVpn] = useState(member.ID ? member.MaxVPN : 0);
    const handleChange = ({ target }) => setVpn(target.value);

    useEffect(() => {
        onChange(vpn);
    }, vpn);

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
