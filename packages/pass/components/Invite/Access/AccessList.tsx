import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import clsx from '@proton/utils/clsx';

import { type AccessDTO, AccessTarget } from '../../../lib/access/types';
import { isGroupInvite } from '../../../lib/invites/invite.utils';
import type { NewUserPendingInvite, PendingInvite, ShareMember as ShareMemberType } from '../../../types';
import { OrganizationItemShareMode } from '../../../types';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { OrganizationPolicyTooltip } from '../../Organization/OrganizationPolicyTooltip';
import { useOrganization } from '../../Organization/OrganizationProvider';
import { ShareMember } from '../Member/ShareMember';
import { PendingExistingMember, PendingNewMember } from '../Member/SharePendingMember';

export type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

type Props = AccessDTO & {
    canManage: boolean;
    canTransfer: boolean;
    isManagerThroughGroup?: boolean;
    className?: string;
    heading?: ReactNode;
    invites?: InviteListItem[];
    members?: ShareMemberType[];
    title?: ReactNode;
    onInvite?: () => void;
};

export const AccessList: FC<Props> = ({
    canManage,
    canTransfer,
    isManagerThroughGroup = false,
    className,
    heading,
    invites,
    itemId,
    members,
    shareId,
    target,
    title,
    onInvite,
}) => {
    const org = useOrganization();
    const orgItemSharingDisabled = org?.settings.ItemShareMode === OrganizationItemShareMode.DISABLED;
    const inviteDisabled = !canManage || (target === AccessTarget.Item && orgItemSharingDisabled);

    return (
        <div className={clsx('flex flex-column gap-y-3', className)}>
            {title && <div className="color-weak text-sm">{title}</div>}

            <FieldsetCluster mode="read" as="div">
                {heading && <div className="px-4">{heading}</div>}

                {onInvite && (
                    <div>
                        <OrganizationPolicyTooltip
                            enforced={orgItemSharingDisabled}
                            text={c('Warning').t`Your organization does not allow sharing individual items`}
                            placement="top-start"
                        >
                            <Button
                                color="norm"
                                shape="ghost"
                                className="w-full text-left"
                                onClick={onInvite}
                                disabled={inviteDisabled}
                            >
                                <IcUsersPlus className="mr-4" />
                                {c('Action').t`Invite more...`}
                            </Button>
                        </OrganizationPolicyTooltip>
                    </div>
                )}

                {invites?.map((item) => {
                    switch (item.type) {
                        case 'new':
                            return (
                                <PendingNewMember
                                    key={item.key}
                                    canManage={canManage}
                                    className="rounded-none"
                                    email={item.invite.invitedEmail}
                                    isGroup={isGroupInvite(item.invite)}
                                    itemId={itemId}
                                    newUserInviteId={item.invite.newUserInviteId}
                                    shareId={shareId}
                                    state={item.invite.state}
                                    target={target}
                                />
                            );
                        case 'existing':
                            return (
                                <PendingExistingMember
                                    key={item.key}
                                    canManage={canManage}
                                    className="rounded-none"
                                    email={item.invite.invitedEmail}
                                    isGroup={isGroupInvite(item.invite)}
                                    inviteId={item.invite.inviteId}
                                    itemId={itemId}
                                    shareId={shareId}
                                    target={target}
                                />
                            );
                    }
                })}

                {members?.map((member) => (
                    <ShareMember
                        key={member.shareId} // member.email can be 'Private group' and not be unique
                        canManage={canManage}
                        canTransfer={canTransfer}
                        className="rounded-none"
                        email={member.email}
                        isGroupShare={member.isGroupShare}
                        isManagerThroughGroup={isManagerThroughGroup}
                        itemId={itemId}
                        me={shareId === member.shareId}
                        owner={member.owner}
                        role={member.shareRoleId}
                        shareId={shareId}
                        target={target}
                        userShareId={member.shareId}
                    />
                ))}
            </FieldsetCluster>
        </div>
    );
};
