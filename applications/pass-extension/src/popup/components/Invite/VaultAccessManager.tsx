import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { selectVaultWithItemsCount } from '@proton/pass/store';
import type { PendingInvite } from '@proton/pass/types';
import { type ShareMember as ShareMemberType } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { isShareManageable } from '@proton/pass/utils/pass/share';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { useShareAccessOptionsPolling } from '../../hooks/useShareAccessOptionsPolling';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { ShareMember } from '../Share/ShareMember';
import { SharePendingMember } from '../Share/SharePendingMember';
import { SharedVaultItem } from '../Vault/SharedVaultItem';

type Props = { shareId: string };
type VaultAccessListItem =
    | { key: string; type: 'pending'; invite: PendingInvite }
    | { key: string; type: 'member'; member: ShareMemberType };

export const VaultAccessManager: FC<Props> = ({ shareId }) => {
    const { createInvite, close } = useInviteContext();
    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const loading = useShareAccessOptionsPolling(shareId);
    const canManage = isShareManageable(vault);

    const listItems = useMemo<VaultAccessListItem[]>(
        () =>
            [
                ...(vault.invites ?? []).map((invite) => ({
                    key: invite.invitedEmail,
                    type: 'pending' as const,
                    invite,
                })),
                ...(vault.members ?? []).map((member) => ({ key: member.email, type: 'member' as const, member })),
            ].sort(sortOn('key', 'ASC')),
        [vault]
    );

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
                                disabled={!canManage}
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
                        {listItems.map((item) => {
                            switch (item.type) {
                                case 'member':
                                    return (
                                        <ShareMember
                                            key={item.key}
                                            email={item.member.email}
                                            shareId={shareId}
                                            userShareId={item.member.shareId}
                                            me={vault.shareId === item.member.shareId}
                                            owner={item.member.owner}
                                            role={item.member.shareRoleId}
                                            canManage={canManage}
                                            canTransfer={vault.owner}
                                        />
                                    );
                                case 'pending':
                                    return (
                                        <SharePendingMember
                                            shareId={shareId}
                                            key={item.key}
                                            email={item.invite.invitedEmail}
                                            inviteId={item.invite.inviteId}
                                            canManage={canManage}
                                        />
                                    );
                            }
                        })}
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
