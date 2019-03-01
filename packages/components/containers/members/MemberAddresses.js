import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ngettext, msgid, c } from 'ttag';
import { Dropdown, DropdownMenu, SmallButton, useModal } from 'react-components';

import AddressModal from '../addresses/AddressModal';

const MemberAddresses = ({ member }) => {
    const title = member.addresses.map(({ Email }) => Email).join(', ');
    const list = member.addresses.map(({ Email: text }) => ({ text }));
    const n = list.length;
    const { isOpen, open, close } = useModal();

    return (
        <Dropdown title={title} className="pm-button-link" content={ngettext(msgid`${n} address`, `${n} addresses`, n)}>
            <DropdownMenu list={list} />
            <div className="flex flex-spacebetween">
                <Link className="pm-button pm-button--small" to="/settings/addresses">{c('Link for member addresses')
                    .t`Manage`}</Link>
                <SmallButton className="pm-button-primary" onClick={open}>{c('Action for member addresses')
                    .t`Add`}</SmallButton>
                <AddressModal show={isOpen} onClose={close} member={member} />
            </div>
        </Dropdown>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberAddresses;
