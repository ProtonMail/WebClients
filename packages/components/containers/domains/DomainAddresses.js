import React from 'react';
import PropTypes from 'prop-types';
import { ngettext, msgid } from 'ttag';
import { Dropdown, DropdownMenu } from 'react-components';

const DomainAddresses = ({ domain }) => {
    const addresses = domain.addresses || [];
    const title = addresses.map(({ Email }) => Email).join(', ');
    const list = addresses.map(({ Email: text }) => ({ text }));
    const n = list.length;

    return (
        <Dropdown title={title} className="pm-button-link" content={ngettext(msgid`${n} address`, `${n} addresses`, n)}>
            <DropdownMenu list={list} />
        </Dropdown>
    );
};

DomainAddresses.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainAddresses;
