import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Select, PrimaryButton } from 'react-components';
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';

const AddressesToolbar = ({ memberIndex, onAddAddress, onChangeMemberIndex, members }) => {
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
            {options.length > 2 ? (
                <Block>
                    <Select
                        id="memberSelect"
                        value={memberIndex}
                        options={options}
                        onChange={({ target: { value } }) => onChangeMemberIndex(+value)}
                    />
                </Block>
            ) : null}
            {memberIndex === ALL_MEMBERS_ID ? null : (
                <Block>
                    <PrimaryButton onClick={() => onAddAddress(members[memberIndex])}>
                        {c('Action').t`Add address`}
                    </PrimaryButton>
                </Block>
            )}
        </>
    );
};

AddressesToolbar.propTypes = {
    memberIndex: PropTypes.number.isRequired,
    members: PropTypes.array,
    onChangeMemberIndex: PropTypes.func.isRequired,
    onAddAddress: PropTypes.func.isRequired
};

export default AddressesToolbar;
