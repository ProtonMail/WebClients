import { type FC, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

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
import { AccessTarget } from '@proton/pass/lib/access/types';
import { getLimitReachedText } from '@proton/pass/lib/invites/invite.utils';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { selectOwnWritableVaults, selectPassPlan, selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type Props = { shareId: string };

export const VaultAccessManager: FC<Props> = ({ shareId }) => {
    const { createVaultInvite, close } = useInviteActions();
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const loading = useShareAccessOptionsPolling(shareId);

    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const plan = useSelector(selectPassPlan);
    const ownWritableVaults = useSelector(selectOwnWritableVaults);

    const access = useShareAccess(shareId);
    const canManage = isShareManageable(vault);
    const canTransfer = vault.owner && ownWritableVaults.length > 1;

    const { limitReached, invites, members } = access;
    const { shared } = vault;

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
                        ? c('Warning').jt`You have reached the limit of users in this vault. ${upgradeLink}`
                        : c('Warning').t`You have reached the limit of members who can access this vault.`}
                </Card>
            );
        }
    }, [canManage, limitReached, plan]);

    const actions = [
        <Button key="modal-close-button" className="shrink-0" icon pill shape="solid" onClick={close}>
            <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
        </Button>,
        <Button key="modal-invite-button" color="norm" pill onClick={onVaultInvite} disabled={!canManage}>
            {c('Action').t`Invite others`}
        </Button>,
    ];

    const fallback = c('Info')
        .t`This vault is not currently shared with anyone. Invite people to share it with others.`;

    return (
        <SidebarModal onClose={close} open>
            <Panel loading={loading} header={<PanelHeader actions={actions} />}>
                <PanelFallback when={!shared} fallback={fallback} className="flex flex-column gap-y-3 flex-nowrap">
                    <VaultHeading shareId={shareId} />

                    {invites.length > 0 && (
                        <AccessList
                            canManage={canManage}
                            canTransfer={canTransfer}
                            invites={invites}
                            onInvite={onVaultInvite}
                            shareId={shareId}
                            title={c('Label').t`Invitations`}
                            target={AccessTarget.Vault}
                        />
                    )}

                    {members.length > 0 && (
                        <AccessList
                            canManage={canManage}
                            canTransfer={canTransfer}
                            members={members}
                            shareId={shareId}
                            title={c('Label').t`Members`}
                            target={AccessTarget.Vault}
                        />
                    )}

                    {warning}

                    <AccessLimitPrompt
                        open={limitModalOpen}
                        onClose={() => setLimitModalOpen(false)}
                        promptText={getLimitReachedText(vault, AccessTarget.Vault)}
                    />
                </PanelFallback>
            </Panel>
        </SidebarModal>
    );
};
