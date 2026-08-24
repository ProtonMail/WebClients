import { type FC, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

import { useShareAccess } from '../../../hooks/invite/useShareAccess';
import { useShareAccessOptionsPolling } from '../../../hooks/useShareAccessOptionsPolling';
import { isItemTarget, isVaultTarget } from '../../../lib/access/access.predicates';
import { AccessTarget } from '../../../lib/access/types';
import { getLimitReachedText } from '../../../lib/invites/invite.utils';
import { isItemShared } from '../../../lib/items/item.predicates';
import { isGroupManagedShare, isShareManageable, isVaultShare } from '../../../lib/shares/share.predicates';
import { selectItem, selectOwnWritableVaults, selectPassPlan, selectShareOrThrow } from '../../../store/selectors';
import type { SelectedItem } from '../../../types';
import { UserPassPlan } from '../../../types/api/plan';
import { prop } from '../../../utils/fp/lens';
import { pipe } from '../../../utils/fp/pipe';
import { Card } from '../../Layout/Card/Card';
import { SidebarModal } from '../../Layout/Modal/SidebarModal';
import { Panel } from '../../Layout/Panel/Panel';
import { PanelFallback } from '../../Layout/Panel/PanelFallback';
import { PanelHeader } from '../../Layout/Panel/PanelHeader';
import { AccessLimitPrompt } from '../Access/AccessLimitPrompt';
import { AccessList } from '../Access/AccessList';
import { AccessUpgrade } from '../Access/AccessUpgrade';
import { useInviteActions } from '../InviteContext';
import { VaultHeading } from '../Vault/VaultHeading';

export const ItemAccessManager: FC<SelectedItem> = ({ shareId, itemId }) => {
    const { createItemInvite, createVaultInvite, close } = useInviteActions();
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const loading = useShareAccessOptionsPolling(shareId, itemId);

    const share = useSelector(selectShareOrThrow(shareId));
    const item = useSelector(selectItem(shareId, itemId))!;
    const plan = useSelector(selectPassPlan);
    const ownWritableVaults = useSelector(selectOwnWritableVaults);

    const access = useShareAccess(shareId, itemId);

    const vaultShare = isVaultShare(share);
    const canManage = isShareManageable(share);
    const isManagerThroughGroup = isGroupManagedShare(share);
    const canTransfer = share.owner && ownWritableVaults.length > 1;
    const canItemInvite = item.data.type !== 'alias';
    const canVaultInvite = vaultShare;
    const { limitReached } = access;

    const itemInvites = useMemo(() => access.invites.filter(pipe(prop('invite'), isItemTarget)), [access]);
    const itemMembers = useMemo(() => access.members.filter(isItemTarget), [access]);
    /** If an item is part of a vault share and is also item shared, a viewer/editor cannot
     * retrieve the item members. To avoid UX confusion: fallback to the `item.shareCount`.
     * Item share counter will reflect the underlying members/invites either way. */
    const itemAccessCount = Math.max(itemInvites.length + itemMembers.length, item.shareCount ?? 0);

    const vaultInvites = useMemo(() => access.invites.filter(pipe(prop('invite'), isVaultTarget)), [access]);
    const vaultMembers = useMemo(() => access.members.filter(isVaultTarget), [access]);
    const vaultAccessCount = vaultInvites.length + vaultMembers.length;
    const vaultMembersCount = vaultMembers.length;

    /** From the perspective of the owner, the item is also
     * considered shared if the parent vault is shared even
     * if the item has not been individually shared yet. */
    const shared = isItemShared(item) || vaultAccessCount > 0;

    const onItemInvite = useCallback(() => {
        if (limitReached) setLimitModalOpen(true);
        else createItemInvite(shareId, itemId);
    }, [limitReached]);

    const onVaultInvite = useCallback(() => {
        if (limitReached) setLimitModalOpen(true);
        else createVaultInvite(shareId);
    }, [limitReached]);

    const warning = useMemo(() => {
        if (canManage && limitReached) {
            const upgradeLink = <AccessUpgrade key="access-upgrade" />;
            return (
                <Card type="primary" className="text-sm">
                    {plan === UserPassPlan.FREE
                        ? c('Warning').jt`You have reached the limit of users for this item. ${upgradeLink}`
                        : c('Warning').t`You have reached the limit of members who can access this item.`}
                </Card>
            );
        }
    }, [canManage, limitReached, plan]);

    const actions = [
        <Button key="modal-close-button" className="shrink-0" icon pill shape="solid" onClick={close}>
            <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
        </Button>,
    ];

    const fallback = c('Info').t`This item is not currently shared with anyone. Invite people to share it with others.`;

    return (
        <SidebarModal onClose={close} open>
            <Panel loading={loading} header={<PanelHeader actions={actions} />}>
                <PanelFallback when={!shared} fallback={fallback} className="flex flex-column gap-y-3 flex-nowrap">
                    <h2 className="text-xl text-bold">{c('Title').t`Shared via`}</h2>

                    {itemAccessCount > 0 && (
                        <AccessList
                            canManage={canManage}
                            canTransfer={false}
                            isManagerThroughGroup={isManagerThroughGroup}
                            invites={itemInvites}
                            itemId={itemId}
                            members={itemMembers}
                            onInvite={canItemInvite ? onItemInvite : undefined}
                            shareId={shareId}
                            target={AccessTarget.Item}
                            title={c('Info').ngettext(
                                msgid`Item sharing: ${itemAccessCount} user`,
                                `Item sharing: ${itemAccessCount} users`,
                                itemAccessCount
                            )}
                        />
                    )}

                    {vaultAccessCount > 0 && (
                        <AccessList
                            canManage={vaultShare && canManage}
                            canTransfer={vaultShare && canTransfer}
                            isManagerThroughGroup={isManagerThroughGroup}
                            heading={vaultShare && <VaultHeading shareId={shareId} />}
                            invites={vaultInvites}
                            itemId={itemId}
                            members={vaultMembers}
                            onInvite={canVaultInvite ? onVaultInvite : undefined}
                            shareId={shareId}
                            target={AccessTarget.Vault}
                            title={c('Info').ngettext(
                                msgid`Vault sharing: ${vaultMembersCount} member`,
                                `Vault sharing: ${vaultMembersCount} members`,
                                vaultMembersCount
                            )}
                        />
                    )}

                    {warning}

                    <AccessLimitPrompt
                        open={limitModalOpen}
                        onClose={() => setLimitModalOpen(false)}
                        promptText={getLimitReachedText(share, AccessTarget.Item)}
                    />
                </PanelFallback>
            </Panel>
        </SidebarModal>
    );
};
