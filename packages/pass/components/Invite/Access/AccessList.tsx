import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { ShareMember } from '@proton/pass/components/Invite/Member/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Invite/Member/SharePendingMember';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { type AccessDTO, AccessTarget } from '@proton/pass/lib/access/types';
import type { NewUserPendingInvite, PendingInvite } from '@proton/pass/types';
import { BitField, type ShareMember as ShareMemberType } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

export type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

type Props = AccessDTO & {
    canManage: boolean;
    canTransfer: boolean;
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
    const orgItemSharingDisabled = org?.settings.ItemShareMode === BitField.DISABLED;
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
                                <Icon name="users-plus" className="mr-4" />
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
                        key={member.email}
                        canManage={canManage}
                        canTransfer={canTransfer}
                        className="rounded-none"
                        email={member.email}
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
