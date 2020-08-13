import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';
import { Member } from 'proton-shared/lib/interfaces';
import { Block, Select, PrimaryButton } from '../../components';

interface Props {
    memberIndex: number;
    onAddAddress: (member: Member) => void;
    onChangeMemberIndex: (i: number) => void;
    members: Member[];
}
const AddressesToolbar = ({ memberIndex, onAddAddress, onChangeMemberIndex, members }: Props) => {
    const options = [
        {
            text: c('Option').t`All users`,
            value: ALL_MEMBERS_ID,
        },
        ...members.map(({ Name }, i) => ({
            text: Name,
            value: i,
        })),
    ];

    return (
        <>
            {options.length > 2 ? (
                <Block>
                    <Select
                        id="memberSelect"
                        value={memberIndex}
                        options={options}
                        onChange={({ target: { value } }: ChangeEvent<HTMLSelectElement>) =>
                            onChangeMemberIndex(+value)
                        }
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

export default AddressesToolbar;
