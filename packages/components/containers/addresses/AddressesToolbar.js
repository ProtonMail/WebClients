import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Label, Select, PrimaryButton, useModal } from 'react-components';

import AddressModal from './AddressModal';

const AddressesToolbar = ({ onChangeMember, member, members, loading }) => {
    const { isOpen, open, close } = useModal();
    const options = members.map(({ ID: value, Name, addresses }) => ({
        text: `${Name} (${addresses.map(({ Email }) => Email).join(', ')})`,
        value
    }));

    const handleChange = ({ target }) => {
        const member = members.data.find(({ ID }) => target.value === ID);
        onChangeMember(member);
    };

    return (
        <Row>
            <Label htmlFor="memberSelect">{c('Label').t`User`}</Label>
            <div>
                <Select
                    disabled={loading}
                    id="memberSelect"
                    value={member.ID}
                    options={options}
                    className="mr1 mb1"
                    onChange={handleChange}
                />
                <br />
                <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Add address`}</PrimaryButton>
                <AddressModal show={isOpen} onClose={close} member={member} />
            </div>
        </Row>
    );
};

AddressesToolbar.propTypes = {
    member: PropTypes.object,
    members: PropTypes.array,
    onChangeMember: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default AddressesToolbar;
