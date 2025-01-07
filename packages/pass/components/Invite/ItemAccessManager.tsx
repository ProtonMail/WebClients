import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Icon, Prompt } from '@proton/components';
import { presentListItem } from '@proton/pass/components/Item/List/utils';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { ShareMember } from '@proton/pass/components/Share/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Share/SharePendingMember';
import { UpsellRef } from '@proton/pass/constants';
import { useShareAccessOptionsPolling } from '@proton/pass/hooks/useShareAccessOptionsPolling';
import { isMemberLimitReached } from '@proton/pass/lib/access/access.predicates';
import { isShared } from '@proton/pass/lib/items/item.predicates';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import {
    selectAccess,
    selectItem,
    selectOwnWritableVaults,
    selectPassPlan,
    selectShareOrThrow,
} from '@proton/pass/store/selectors';
import type { NewUserPendingInvite, PendingInvite, ShareType, UniqueItem } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { useInviteActions } from './InviteProvider';

type Props = UniqueItem;

type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

export const ItemAccessManager: FC<Props> = ({ shareId, itemId }) => {
    const { createItemInvite, close } = useInviteActions();
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(selectItem(shareId, itemId))!;
    const access = useSelector(selectAccess(shareId, itemId));
    const { members, invites, newUserInvites } = access;
    const { heading, subheading } = presentListItem(item);
    const plan = useSelector(selectPassPlan);
    const hasMultipleOwnedWritableVaults = useSelector(selectOwnWritableVaults).length > 1;

    const [limitModalOpen, setLimitModalOpen] = useState(false);

    const loading = useShareAccessOptionsPolling(shareId, itemId);
    const canManage = isShareManageable(vault);
    const b2b = plan === UserPassPlan.BUSINESS;

    const allInvites = useMemo<InviteListItem[]>(
        () =>
            [
                ...(invites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'existing' as const,
                    invite,
                })),
                ...(newUserInvites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'new' as const,
                    invite,
                })),
            ].sort(sortOn('key', 'ASC')),
        [access]
    );

    const shared = isShared(item);

    const memberLimitReached = isMemberLimitReached(vault, access);

    const warning = (() => {
        if (canManage && memberLimitReached) {
            const upgradeLink = (
                <UpgradeButton
                    inline
                    label={c('Action').t`Upgrade now to share with more people`}
                    upsellRef={UpsellRef.LIMIT_SHARING}
                    key="access-upgrade-link"
                />
            );
            return plan === UserPassPlan.FREE
                ? c('Warning').jt`You have reached the limit of users for this item. ${upgradeLink}`
                : c('Warning').t`You have reached the limit of members who can access this item.`;
        }
    })();

    return (
        <SidebarModal onClose={close} open>
            <Panel
                loading={loading}
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="shrink-0"
                                icon
                                pill
                                shape="solid"
                                onClick={close}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button
                                key="modal-invite-button"
                                color="norm"
                                pill
                                onClick={() =>
                                    memberLimitReached ? setLimitModalOpen(true) : createItemInvite({ item })
                                }
                                disabled={!canManage || (plan === UserPassPlan.FREE && memberLimitReached)}
                            >
                                {c('Action').t`Invite others`}
                            </Button>,
                        ]}
                    />
                }
            >
                <div className="flex gap-3 flex-nowrap items-center py-3 w-full">
                    <SafeItemIcon
                        item={item}
                        size={5}
                        className={clsx('shrink-0 relative', itemTypeToSubThemeClassName[item.data.type])}
                    />
                    <div className="text-left flex-1">
                        <div className="text-ellipsis">{heading}</div>
                        <div
                            className={clsx([
                                'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                                item.data.type === 'note' && isEmptyString(item.data.metadata.note.v) && 'text-italic',
                            ])}
                        >
                            {subheading}
                        </div>
                    </div>
                </div>

                {shared ? (
                    <div className="flex flex-column gap-y-3">
                        {allInvites.length > 0 && <span className="color-weak">{c('Label').t`Invitations`}</span>}

                        {allInvites.map((item) => {
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
                                        />
                                    );
                            }
                        })}

                        {members.length > 0 && <span className="color-weak">{c('Label').t`Members`}</span>}

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
                            />
                        ))}
                        {warning && (
                            <Card type="primary" className="text-sm">
                                {warning}
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-center flex flex-column gap-y-3 text-center color-weak text-sm">
                        {c('Info')
                            .t`This item is not currently shared with anyone. Invite people to share it with others.`}
                    </div>
                )}

                <Prompt
                    buttons={
                        <Button
                            pill
                            onClick={() => setLimitModalOpen(false)}
                            className="w-full"
                            shape="solid"
                            color="weak"
                        >
                            {c('Action').t`OK`}
                        </Button>
                    }
                    className="text-left"
                    onClose={() => setLimitModalOpen(false)}
                    open={limitModalOpen}
                    title={c('Title').t`Member limit`}
                    enableCloseWhenClickOutside
                >
                    <Alert className="mb-4 text-sm" type="error">
                        {b2b ? (
                            <>
                                {c('Error').t`Cannot send invitations at the moment`}{' '}
                                {c('Warning').t`Please contact us to investigate the issue`}
                            </>
                        ) : (
                            // translator: full message is "Items can’t contain more than 10 users.""
                            c('Success').ngettext(
                                msgid`Items can’t contain more than ${vault.targetMaxMembers} user.`,
                                `Items can’t contain more than ${vault.targetMaxMembers} users.`,
                                vault.targetMaxMembers
                            )
                        )}
                    </Alert>
                </Prompt>
            </Panel>
        </SidebarModal>
    );
};
