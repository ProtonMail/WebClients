import React from 'react';
import PropTypes from 'prop-types';
import { ngettext, msgid, c } from 'ttag';
import { Dropdown, DropdownMenu, Button, PrimaryButton } from 'react-components';

const MemberAddresses = ({ member }) => {
    const title = member.addresses.map(({ Email }) => Email).join(', ');
    const list = member.addresses.map(({ Email: text }) => ({ text }));
    const n = list.length;
    const handleManage = () => {};
    const handleAdd = () => {};

    return (
        <Dropdown title={title} className="pm-button-link" content={ngettext(msgid`${n} address`, `${n} addresses`, n)}>
            <DropdownMenu list={list} />
            <Button onClick={handleManage}>{c('Action for member addresses').t`Manage`}</Button>
            <PrimaryButton onClick={handleAdd}>{c('Action for member addresses').t`Add`}</PrimaryButton>
        </Dropdown>
    );
};

MemberAddresses.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberAddresses;