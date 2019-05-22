import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Field, Label, Select } from 'react-components';
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';

import AddAddressButton from './AddAddressButton';

const getOptions = (members) => {
    return members.reduce(
        (acc, { ID: value, Name }) => {
            acc.push({
                text: Name,
                value
            });
            return acc;
        },
        [
            {
                text: c('Option').t`All users`,
                value: ALL_MEMBERS_ID
            }
        ]
    );
};

const AddressesToolbar = ({ member, onChangeMember, members }) => {
    const options = getOptions(members);

    const handleChange = ({ target }) => {
        const newID = target.value;
        onChangeMember(newID === ALL_MEMBERS_ID ? { ID: ALL_MEMBERS_ID } : members.find(({ ID }) => newID === ID));
    };

    return (
        <Row>
            <Label htmlFor="memberSelect">{c('Label').t`User`}</Label>
            <Field className="w100 flex">
                <Select id="memberSelect" value={member.ID} options={options} className="mr1" onChange={handleChange} />
                {member.ID === ALL_MEMBERS_ID ? null : <AddAddressButton member={member} />}
            </Field>
        </Row>
    );
};

AddressesToolbar.propTypes = {
    member: PropTypes.object,
    members: PropTypes.array,
    onChangeMember: PropTypes.func.isRequired
};

export default AddressesToolbar;
