import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Badge, Icon } from '@proton/components/components';

import type { NewGroupMember } from './EditGroup';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

interface Props {
    member: NewGroupMember;
    handleRemoveNewMember: (memberToRemove: NewGroupMember) => void;
    submitting?: boolean;
}

export const NewGroupMemberItem = ({ member, handleRemoveNewMember, submitting }: Props) => {
    const { Name, Address } = member;

    return (
        <>
            <GroupMemberItemWrapper memberEmail={Address} memberName={Name}>
                {!submitting ? (
                    <Button
                        shape="ghost"
                        size="small"
                        icon
                        onClick={() => {
                            handleRemoveNewMember(member);
                        }}
                        title={c('Action').t`Delete member`}
                    >
                        <Icon name="cross" size={5} alt={c('Action').t`Delete member`} />
                    </Button>
                ) : (
                    <div className="flex flex-column flex-nowrap self-center">
                        <span>
                            <Badge
                                type="info"
                                className="rounded-sm"
                                tooltip={c('tooltip').t`Sending member invitation`}
                            >{c('invitation status').t`Sending invite...`}</Badge>
                        </span>
                    </div>
                )}
            </GroupMemberItemWrapper>
        </>
    );
};
