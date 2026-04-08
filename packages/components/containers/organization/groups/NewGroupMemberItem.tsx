import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Badge } from '@proton/components/components/badge/Badge';
import { IcCross } from '@proton/icons/icons/IcCross';

import type { NewGroupMember } from './AddUsersToGroupModal';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

interface Props {
    member: NewGroupMember;
    handleRemoveNewMember: (memberToRemove: NewGroupMember) => void;
    submitting?: boolean;
    showMailFeatures: boolean;
}

export const NewGroupMemberItem = ({ member, handleRemoveNewMember, submitting, showMailFeatures }: Props) => {
    const { Name, Address, GroupMemberType } = member;

    return (
        <>
            <GroupMemberItemWrapper
                memberEmail={Address}
                memberName={Name}
                groupMemberType={GroupMemberType}
                showMailFeatures={showMailFeatures}
            >
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
                        <IcCross size={5} alt={c('Action').t`Delete member`} />
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
