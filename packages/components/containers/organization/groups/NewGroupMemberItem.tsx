import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';

import type { NewGroupMember } from './EditGroup';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

interface Props {
    member: NewGroupMember;
    handleRemoveNewMember: (memberToRemove: NewGroupMember) => void;
}

export const NewGroupMemberItem = ({ member, handleRemoveNewMember }: Props) => {
    const { Name, Address } = member;

    return (
        <>
            <GroupMemberItemWrapper memberEmail={Address} memberName={Name}>
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    onClick={() => {
                        handleRemoveNewMember(member);
                    }}
                    title={c('Action').t`Delete member`}
                >
                    <Icon name="cross" className="color-danger" size={5} alt={c('Action').t`More options`} />
                </Button>
            </GroupMemberItemWrapper>
        </>
    );
};
