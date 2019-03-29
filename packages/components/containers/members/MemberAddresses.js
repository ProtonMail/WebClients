import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ngettext, msgid, c } from 'ttag';
import { Dropdown, DropdownMenu, SmallButton, useModal, AddressModal } from 'react-components';

const MemberAddresses = ({ member }) => {
    const addresses = member.addresses || [];
    const title = addresses.map(({ Email }) => Email).join(', ');
    const list = addresses.map(({ Email: text }) => ({ text }));
    const n = list.length;
    const { isOpen, open, close } = useModal();

    return (
        <>
            <Dropdown
                title={title}
                className="pm-button--link"
                content={ngettext(msgid`${n} address`, `${n} addresses`, n)}
            >
                <DropdownMenu list={list} />
                <div className="flex flex-spacebetween">
                    <Link className="pm-button pm-button--small" to="/settings/addresses">{c(
                        'Link for member addresses'
                    ).t`Manage`}</Link>
                    <SmallButton className="pm-button-primary" onClick={open}>{c('Action for member addresses')
                        .t`Add`}</SmallButton>
                </div>
            </Dropdown>
            <AddressModal show={isOpen} onClose={close} member={member} />
        </>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberAddresses;
