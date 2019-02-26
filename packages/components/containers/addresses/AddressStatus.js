import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Badge } from 'react-components';

const AddressStatus = ({ address, index }) => {
    const badges = [];
    const { Status, Receive, DomainID, HasKeys } = address;

    if (!index) {
        badges.push({ text: c('Badge').t`Default`, type: 'default' });
    }

    if (Status === 1 && Receive === 1) {
        badges.push({ text: c('Badge').t`Active`, type: 'success' });
    }

    if (Status === 0) {
        badges.push({ text: c('Badge').t`Disabled`, type: 'warning' });
    }

    if (DomainID === null) {
        badges.push({ text: c('Badge').t`Orphan`, type: 'origin' });
    }

    if (HasKeys === 0) {
        badges.push({ text: c('Badge').t`Missing keys`, type: 'warning' });
    }

    return badges.map(({ text, type }, index) => <Badge type={type} key={index.toString()}>{text}</Badge>);
};

AddressStatus.propTypes = {
    address: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
};

export default AddressStatus;