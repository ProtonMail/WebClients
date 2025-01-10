import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Icon, Prompt } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { UpsellRef } from '@proton/pass/constants';
import { useShareAccessOptionsPolling } from '@proton/pass/hooks/useShareAccessOptionsPolling';
import { isMemberLimitReached } from '@proton/pass/lib/access/access.predicates';
import { isShared } from '@proton/pass/lib/items/item.predicates';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import {
    selectAccess,
    selectItem,
    selectPassPlan,
    selectShareOrThrow,
    selectVaultItemsCount,
} from '@proton/pass/store/selectors';
import type { InviteListItem, UniqueItem } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { sortOn } from '@proton/pass/utils/fp/sort';
import clsx from '@proton/utils/clsx';

import { Card } from '../../Layout/Card/Card';
import { getItemsText } from '../../Settings/helper';
import { VaultIcon } from '../../Vault/VaultIcon';
import { ItemMembersList } from './ItemMembersList';

type Props = UniqueItem;

export const ItemAccessManager: FC<Props> = ({ shareId, itemId }) => {
    const { createItemInvite, createVaultInvite, close } = useInviteActions();
    /** vault.content may be an empty object if user has sharing access via item sharing and not vault sharing */
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(selectItem(shareId, itemId))!;
    const access = useSelector(selectAccess(shareId, itemId));
    const { members, invites, newUserInvites } = access;
    const plan = useSelector(selectPassPlan);

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

    const itemInvites = allInvites.filter(({ invite }) => invite.targetType === ShareType.Item);
    const itemMembers = members.filter((member) => member.targetType === ShareType.Item);
    const itemTotalMembersCount = itemInvites.length + itemMembers.length;

    const vaultInvites = allInvites.filter(({ invite }) => invite.targetType === ShareType.Vault);
    const vaultMembers = members.filter((member) => member.targetType === ShareType.Vault);
    const vaultTotalMembersCount = vaultInvites.length + vaultMembers.length;

    const count = useSelector(selectVaultItemsCount(shareId));

    const shared = isShared(item);

    const memberLimitReached = isMemberLimitReached(vault, access);

    const handleItemInviteClick = () => {
        if (memberLimitReached) setLimitModalOpen(true);
        else createItemInvite(shareId, itemId);
    };

    const handleVaultInviteClick = () => {
        if (memberLimitReached) setLimitModalOpen(true);
        else createVaultInvite(shareId);
    };

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
                        ]}
                    />
                }
            >
                <h2 className="text-xl text-bold mb-6">{c('Title').t`Shared via`}</h2>

                {shared ? (
                    <>
                        <div className="color-weak text-sm mb-3">
                            {c('Info').ngettext(
                                msgid`Item sharing: ${itemTotalMembersCount} member`,
                                `Item sharing: ${itemTotalMembersCount} members`,
                                itemTotalMembersCount
                            )}
                        </div>
                        {itemTotalMembersCount && (
                            <ItemMembersList
                                shareId={vault.shareId}
                                itemId={itemId}
                                invites={itemInvites}
                                members={itemMembers}
                                onInviteClick={handleItemInviteClick}
                                className="mb-6"
                            />
                        )}

                        <div className="color-weak text-sm mb-3">
                            {c('Info').ngettext(
                                msgid`Vault sharing: ${vaultTotalMembersCount} member`,
                                `Vault sharing: ${vaultTotalMembersCount} members`,
                                vaultTotalMembersCount
                            )}
                        </div>
                        {vaultTotalMembersCount && (
                            <ItemMembersList
                                shareId={vault.shareId}
                                itemId={itemId}
                                invites={vaultInvites}
                                members={vaultMembers}
                                onInviteClick={handleVaultInviteClick}
                                itemIcon={
                                    /* If vault.content.display is not defined, the user only has item sharing
                                     * and doesn't have access to vault sharing.
                                     * So we don't display the vault */
                                    vault.content?.display ? (
                                        <div className="flex gap-3 flex-nowrap items-center py-3 w-full pl-4">
                                            <VaultIcon
                                                color={vault.content.display.color}
                                                icon={vault.content.display.icon}
                                                size={4}
                                                background
                                            />
                                            <div className="text-left flex-1">
                                                <div className="text-ellipsis">{vault.content.name}</div>
                                                <div
                                                    className={clsx([
                                                        'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                                                    ])}
                                                >
                                                    {count && getItemsText(count)}
                                                </div>
                                            </div>
                                        </div>
                                    ) : undefined
                                }
                            />
                        )}

                        {warning && (
                            <Card type="primary" className="text-sm">
                                {warning}
                            </Card>
                        )}
                    </>
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
