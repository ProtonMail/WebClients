import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { ItemCard } from '@proton/pass/components/Item/ItemCard';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { ShareMember } from '@proton/pass/components/Share/ShareMember';
import { PendingExistingMember, PendingNewMember } from '@proton/pass/components/Share/SharePendingMember';
import { SharedVaultItem } from '@proton/pass/components/Vault/SharedVaultItem';
import { useShareAccessOptionsPolling } from '@proton/pass/hooks/useShareAccessOptionsPolling';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { selectOwnWritableVaults, selectPassPlan, selectVaultWithItemsCount } from '@proton/pass/store/selectors';
import type { NewUserPendingInvite, PendingInvite } from '@proton/pass/types';
import { type ShareMember as ShareMemberType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { sortOn } from '@proton/pass/utils/fp/sort';

type Props = { shareId: string };
type InviteListItem =
    | { key: string; type: 'existing'; invite: PendingInvite }
    | { key: string; type: 'new'; invite: NewUserPendingInvite };

export const VaultAccessManager: FC<Props> = ({ shareId }) => {
    const { createInvite, close } = useInviteContext();
    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const plan = useSelector(selectPassPlan);
    const loading = useShareAccessOptionsPolling(shareId);
    const canManage = isShareManageable(vault);
    const hasMultipleOwnedWritableVaults = useSelector(selectOwnWritableVaults).length > 1;

    const members = useMemo<ShareMemberType[]>(() => (vault.members ?? []).sort(sortOn('email', 'ASC')), [vault]);
    const invites = useMemo<InviteListItem[]>(
        () =>
            [
                ...(vault.invites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'existing' as const,
                    invite,
                })),
                ...(vault.newUserInvites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'new' as const,
                    invite,
                })),
            ].sort(sortOn('key', 'ASC')),
        [vault]
    );

    const totalCount = members.length + invites.length;
    const memberLimitReached = totalCount >= vault.targetMaxMembers;

    const warning = (() => {
        if (canManage && memberLimitReached) {
            return plan === UserPassPlan.FREE
                ? c('Warning').t`Upgrade to a paid plan to invite more members to this vault.`
                : c('Warning').t`You have reached the limit of members who can access this vault.`;
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
                                className="flex-item-noshrink"
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
                                onClick={() => createInvite(shareId)}
                                disabled={!canManage || memberLimitReached}
                            >
                                {c('Action').t`Invite others`}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem vault={vault} className="mt-3 mb-6" />

                {vault.shared ? (
                    <div className="flex flex-column gap-y-3">
                        {warning && <ItemCard>{warning}</ItemCard>}

                        {invites.length > 0 && <span className="color-weak">{c('Label').t`Invitations`}</span>}

                        {invites.map((item) => {
                            switch (item.type) {
                                case 'new':
                                    return (
                                        <PendingNewMember
                                            shareId={shareId}
                                            key={item.key}
                                            email={item.invite.invitedEmail}
                                            newUserInviteId={item.invite.newUserInviteId}
                                            canManage={canManage}
                                            state={item.invite.state}
                                        />
                                    );
                                case 'existing':
                                    return (
                                        <PendingExistingMember
                                            key={item.key}
                                            shareId={shareId}
                                            email={item.invite.invitedEmail}
                                            inviteId={item.invite.inviteId}
                                            canManage={canManage}
                                        />
                                    );
                            }
                        })}

                        {members.length > 0 && <span className="color-weak">{c('Label').t`Members`}</span>}

                        {members.map((member) => (
                            <ShareMember
                                key={member.email}
                                email={member.email}
                                shareId={shareId}
                                userShareId={member.shareId}
                                me={vault.shareId === member.shareId}
                                owner={member.owner}
                                role={member.shareRoleId}
                                canManage={canManage}
                                canTransfer={vault.owner && hasMultipleOwnedWritableVaults}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="absolute-center flex flex-column gap-y-3 text-center color-weak text-sm">
                        {c('Info')
                            .t`This vault is not currently shared with anyone. Invite people to share it with others.`}
                    </div>
                )}
            </Panel>
        </SidebarModal>
    );
};
