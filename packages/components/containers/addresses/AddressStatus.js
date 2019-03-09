import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Badge } from 'react-components';
import { ADDRESS_STATUS, RECEIVE_ADDRESS } from 'proton-shared/lib/constants';

const AddressStatus = ({ address, index }) => {
    const badges = [];
    const { Status, Receive, DomainID, HasKeys } = address;

    if (!index) {
        badges.push({ text: c('Badge').t`Default`, type: 'default' });
    }

    if (Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES) {
        badges.push({ text: c('Badge').t`Active`, type: 'success' });
    }

    if (Status === ADDRESS_STATUS.STATUS_DISABLED) {
        badges.push({ text: c('Badge').t`Disabled`, type: 'warning' });
    }

    if (DomainID === null) {
        badges.push({ text: c('Badge').t`Orphan`, type: 'origin' });
    }

    if (!HasKeys) {
        badges.push({ text: c('Badge').t`Missing keys`, type: 'warning' });
    }

    return badges.map(({ text, type }, index) => (
        <Badge type={type} key={index.toString()}>
            {text}
        </Badge>
    ));
};

AddressStatus.propTypes = {
    address: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
};

export default AddressStatus;
