import { type FC, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { AccessLimitPrompt } from '@proton/pass/components/Invite/Access/AccessLimitPrompt';
import { AccessList } from '@proton/pass/components/Invite/Access/AccessList';
import { AccessUpgrade } from '@proton/pass/components/Invite/Access/AccessUpgrade';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { VaultHeading } from '@proton/pass/components/Invite/Vault/VaultHeading';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelFallback } from '@proton/pass/components/Layout/Panel/PanelFallback';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useShareAccess } from '@proton/pass/hooks/invite/useShareAccess';
import { useShareAccessOptionsPolling } from '@proton/pass/hooks/useShareAccessOptionsPolling';
import { isShared } from '@proton/pass/lib/items/item.predicates';
import { isShareManageable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { selectItem, selectOwnWritableVaults, selectPassPlan, selectShareOrThrow } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const ItemAccessManager: FC<SelectedItem> = ({ shareId, itemId }) => {
    const { createItemInvite, createVaultInvite, close } = useInviteActions();
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const loading = useShareAccessOptionsPolling(shareId, itemId);

    const share = useSelector(selectShareOrThrow(shareId));
    const item = useSelector(selectItem(shareId, itemId))!;
    const plan = useSelector(selectPassPlan);
    const ownWritableVaults = useSelector(selectOwnWritableVaults);

    const access = useShareAccess(shareId, itemId);
    const canManage = isShareManageable(share);
    const canTransfer = !itemId && share.owner && ownWritableVaults.length > 1;

    const { itemInvites, itemMembers, itemAccessCount, limitReached } = access;
    const { vaultInvites, vaultMembers, vaultAccessCount } = access;

    /** From the perspective of the owner, the item is also
     * considered shared if the parent vault is shared even
     * if the item has not been individually shared yet. */
    const shared = isShared(item) || vaultAccessCount > 0;

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
            const upgradeLink = <AccessUpgrade />;
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
            <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
        </Button>,
    ];

    const fallback = c('Info').t`This item is not currently shared with anyone. Invite people to share it with others.`;

    return (
        <SidebarModal onClose={close} open>
            <Panel loading={loading} header={<PanelHeader actions={actions} />}>
                <PanelFallback when={!shared} fallback={fallback}>
                    <h2 className="text-xl text-bold mb-6">{c('Title').t`Shared via`}</h2>

                    {itemAccessCount > 0 && (
                        <AccessList
                            canManage={canManage}
                            canTransfer={false}
                            className="mb-6"
                            invites={itemInvites}
                            itemId={itemId}
                            members={itemMembers}
                            onInvite={onItemInvite}
                            shareId={shareId}
                            title={c('Info').ngettext(
                                msgid`Item sharing: ${itemAccessCount} member`,
                                `Item sharing: ${itemAccessCount} members`,
                                itemAccessCount
                            )}
                        />
                    )}

                    {isVaultShare(share) && vaultAccessCount > 0 && (
                        /** This section should only be visible when opening
                         * the item access manager view from the owner's side */
                        <AccessList
                            canManage={canManage}
                            canTransfer={canTransfer}
                            heading={<VaultHeading shareId={shareId} />}
                            invites={vaultInvites}
                            itemId={itemId}
                            members={vaultMembers}
                            onInvite={onVaultInvite}
                            shareId={shareId}
                            title={c('Info').ngettext(
                                msgid`Vault sharing: ${vaultAccessCount} member`,
                                `Vault sharing: ${vaultAccessCount} members`,
                                vaultAccessCount
                            )}
                        />
                    )}

                    {warning}

                    <AccessLimitPrompt
                        open={limitModalOpen}
                        onClose={() => setLimitModalOpen(false)}
                        promptText={
                            // translator: full message is "Items can’t contain more than 10 users.""
                            c('Success').ngettext(
                                msgid`Items can’t contain more than ${share.targetMaxMembers} user.`,
                                `Items can’t contain more than ${share.targetMaxMembers} users.`,
                                share.targetMaxMembers
                            )
                        }
                    />
                </PanelFallback>
            </Panel>
        </SidebarModal>
    );
};
