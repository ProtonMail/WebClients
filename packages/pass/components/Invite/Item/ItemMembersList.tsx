import type { ReactNode } from 'react';
import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';
import { ShareMember } from '@proton/pass/components/Share/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Share/SharePendingMember';
import { isMemberLimitReached } from '@proton/pass/lib/access/access.predicates';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import {
    selectAccess,
    selectOwnWritableVaults,
    selectPassPlan,
    selectShareOrThrow,
} from '@proton/pass/store/selectors';
import type { InviteListItem, ShareType, UniqueItem } from '@proton/pass/types';
import { type ShareMember as ShareMemberType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';

type Props = UniqueItem & {
    invites: InviteListItem[];
    members: ShareMemberType[];
    onInviteClick: () => void;
    itemIcon?: ReactNode;
    className?: string;
};

export const ItemMembersList: FC<Props> = ({
    shareId,
    itemId,
    invites,
    members,
    onInviteClick,
    itemIcon,
    className,
}) => {
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const access = useSelector(selectAccess(shareId, itemId));
    const plan = useSelector(selectPassPlan);
    const hasMultipleOwnedWritableVaults = useSelector(selectOwnWritableVaults).length > 1;

    const canManage = isShareManageable(vault);

    const memberLimitReached = isMemberLimitReached(vault, access);
    const inviteDisabled = !canManage || (plan === UserPassPlan.FREE && memberLimitReached);

    return (
        <div className={clsx('flex flex-column gap-y-3', className)}>
            <FieldsetCluster mode="read" as="div">
                {itemIcon}
                <div>
                    <Button
                        color="norm"
                        shape="ghost"
                        className="pr-auto"
                        onClick={onInviteClick}
                        disabled={inviteDisabled}
                    >
                        <Icon name="users-plus" className="mr-4" />
                        {c('Action').t`Invite more...`}
                    </Button>
                </div>
                {invites.map((item) => {
                    switch (item.type) {
                        case 'new':
                            return (
                                <PendingNewMember
                                    shareId={vault.shareId}
                                    key={item.key}
                                    email={item.invite.invitedEmail}
                                    newUserInviteId={item.invite.newUserInviteId}
                                    canManage={canManage}
                                    state={item.invite.state}
                                    itemId={itemId}
                                    className="rounded-none"
                                />
                            );
                        case 'existing':
                            return (
                                <PendingExistingMember
                                    key={item.key}
                                    shareId={vault.shareId}
                                    email={item.invite.invitedEmail}
                                    inviteId={item.invite.inviteId}
                                    canManage={canManage}
                                    itemId={itemId}
                                    className="rounded-none"
                                />
                            );
                    }
                })}

                {members.map((member) => (
                    <ShareMember
                        key={member.email}
                        email={member.email}
                        shareId={vault.shareId}
                        userShareId={member.shareId}
                        me={vault.shareId === member.shareId}
                        owner={member.owner}
                        role={member.shareRoleId}
                        canManage={canManage}
                        canTransfer={!itemId && vault.owner && hasMultipleOwnedWritableVaults}
                        itemId={itemId}
                        className="rounded-none"
                    />
                ))}
            </FieldsetCluster>
        </div>
    );
};
