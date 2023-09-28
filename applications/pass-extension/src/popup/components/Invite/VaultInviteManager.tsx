import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { selectVaultWithItemsCount } from '@proton/pass/store';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { ShareMember } from '../Share/ShareMember';
import { SharedVaultItem } from '../Vault/SharedVaultItem';

type Props = { shareId: string };

export const VaultInviteManager: FC<Props> = ({ shareId }) => {
    const { createInvite, close } = useInviteContext();
    const vault = useSelector(selectVaultWithItemsCount(shareId));

    return (
        <SidebarModal onClose={close} open>
            <Panel
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

                <div className="flex gap-y-3">
                    {vault.invites?.map((pending) => (
                        <ShareMember shareId={shareId} key={pending.inviteId} email={pending.invitedEmail} pending />
                    ))}

                    {vault.members?.map((member) => (
                        <ShareMember
                            key={member.email}
                            email={member.email}
                            shareId={shareId}
                            userShareId={member.shareId}
                            pending={false}
                            role={member.shareRoleId}
                            owner={member.owner}
                        />
                    ))}
                </div>
            </Panel>
        </SidebarModal>
    );
};
