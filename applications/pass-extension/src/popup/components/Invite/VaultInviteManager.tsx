import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { selectVaultWithItemsCount } from '@proton/pass/store';
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

export const VaultInviteManager: FC<Props> = ({ shareId }) => {
    const { createInvite, close } = useInviteContext();
    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const loading = useShareAccessOptionsPolling(shareId);
    const canManage = isShareManageable(vault);

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

                            <Button key="modal-invite-button" color="norm" pill onClick={() => createInvite(shareId)}>
                                {c('Action').t`Invite people`}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem vault={vault} className="mt-3 mb-6" />

                {vault.shared ? (
                    <div className="flex flex-column gap-y-3">
                        {vault.invites?.map((invite) => (
                            <SharePendingMember
                                shareId={shareId}
                                key={invite.inviteId}
                                email={invite.invitedEmail}
                                inviteId={invite.inviteId}
                                canManage={canManage}
                            />
                        ))}

                        {vault.members?.map((member) => (
                            <ShareMember
                                key={member.email}
                                email={member.email}
                                shareId={shareId}
                                userShareId={member.shareId}
                                me={vault.shareId === member.shareId}
                                owner={member.owner}
                                role={member.shareRoleId}
                                canManage={canManage}
                                canTransfer={vault.owner}
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
