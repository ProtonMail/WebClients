import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Label, Select, PrimaryButton, useModal } from 'react-components';

import AddressModal from './AddressModal';

const AddressesToolbar = ({ onChangeMember, member, members, loading }) => {
    const { isOpen, open, close } = useModal();
    const options = members.map(({ ID: value, Name: text }) => ({ text, value }));

    const handleChange = ({ target }) => {
        const member = members.data.find(({ ID }) => target.value === ID);
        onChangeMember(member);
    };

    return (
        <Block>
            <Label htmlFor="memberSelect" className="mr1">{c('Label').t`User:`}</Label>
            <Select
                disabled={loading}
                id="memberSelect"
                value={member.ID}
                options={options}
                className="mr1"
                onChange={handleChange}
            />
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Add address`}</PrimaryButton>
            <AddressModal show={isOpen} onClose={close} member={member} />
        </Block>
    );
};

AddressesToolbar.propTypes = {
    member: PropTypes.object,
    members: PropTypes.array,
    onChangeMember: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default AddressesToolbar;
