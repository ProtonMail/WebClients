import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/components';
import { selectUser, selectVaultWithItemsCount } from '@proton/pass/store';
import { ShareRole } from '@proton/pass/types';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { ShareMember } from '../Share/ShareMember';
import { SharedVaultItem } from '../Vault/SharedVaultItem';

type Props = ModalProps & { shareId: string };

export const VaultInviteManager: FC<Props> = ({ shareId, onClose, ...props }) => {
    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const user = useSelector(selectUser);

    const handleInviteClick = () => {};

    return (
        <SidebarModal {...props} onClose={onClose}>
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
                                onClick={onClose}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button key="modal-invite-button" color="norm" pill onClick={handleInviteClick}>
                                {c('Action').t`Invite people`}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem vault={vault} className="mt-3 mb-6" />
                <ShareMember
                    email={user?.Email}
                    displayName={user?.DisplayName}
                    role={ShareRole.ADMIN}
                    className="mb-3"
                    owner
                    pending={false}
                />
                <ShareMember
                    email={'editor@example.com'}
                    displayName={'Editor'}
                    role={ShareRole.WRITE}
                    className="mb-3"
                    owner={false}
                    pending={false}
                />
                <ShareMember
                    email={'the.tester@example.com'}
                    displayName={'The Tester'}
                    role={ShareRole.READ}
                    className="mb-3"
                    owner={false}
                    pending
                />
            </Panel>
        </SidebarModal>
    );
};
