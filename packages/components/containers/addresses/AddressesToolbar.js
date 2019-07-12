import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Select } from 'react-components';
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';

import AddAddressButton from './AddAddressButton';

const AddressesToolbar = ({ memberIndex, onChangeMemberIndex, members }) => {
    const options = [
        {
            text: c('Option').t`All users`,
            value: ALL_MEMBERS_ID
        },
        ...members.map(({ Name }, i) => ({
            text: Name,
            value: i
        }))
    ];

    return (
        <>
            <Block>
                <Select
                    id="memberSelect"
                    value={memberIndex}
                    options={options}
                    onChange={({ target: { value } }) => onChangeMemberIndex(+value)}
                />
            </Block>
            <Block>{memberIndex === ALL_MEMBERS_ID ? null : <AddAddressButton member={members[memberIndex]} />}</Block>
        </>
    );
};

AddressesToolbar.propTypes = {
    memberIndex: PropTypes.number.isRequired,
    members: PropTypes.array,
    onChangeMemberIndex: PropTypes.func.isRequired
};

export default AddressesToolbar;
