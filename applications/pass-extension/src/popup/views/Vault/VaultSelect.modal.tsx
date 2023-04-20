import { type VFC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { selectAllVaultWithItemsCount } from '@proton/pass/store/selectors';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { RadioButtonGroup, RadioLabelledButton } from '../../components/Controls/RadioButtonGroup';
import { PanelHeader } from '../../components/Panel/Header';
import { Panel } from '../../components/Panel/Panel';
import { VaultIcon } from '../../components/Vault/VaultIcon';

export type Props = Omit<ModalProps, 'onSubmit'> & {
    shareId: string;
    onSubmit: (shareId: string) => void;
};

export const VaultSelectModal: VFC<Props> = ({ onSubmit, shareId, ...props }) => {
    const vaultsWithItemCount = useSelector(selectAllVaultWithItemsCount);

    return (
        <SidebarModal {...props}>
            <Panel
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,
                        ]}
                    />
                }
            >
                <RadioButtonGroup name="vault-select" className="flex-columns" value={shareId} onValue={onSubmit}>
                    {vaultsWithItemCount.map((vault) => (
                        <RadioLabelledButton value={vault.shareId} key={vault.shareId}>
                            <VaultIcon
                                size="large"
                                color={vault.content.display.color}
                                icon={vault.content.display.icon}
                            />
                            <div className="flex flex-item-fluid flex-column">
                                <span className="text-ellipsis inline-block max-w100 color-norm">
                                    {vault.content.name}
                                </span>
                                <span className="block color-weak">{vault.count} items</span>
                            </div>
                        </RadioLabelledButton>
                    ))}
                </RadioButtonGroup>
            </Panel>
        </SidebarModal>
    );
};

export const useVaultSelectModalHandles = () => {
    const [modalState, setModalState] = useState<Pick<Props, 'shareId' | 'open'>>({ open: false, shareId: '' });

    return {
        modalState,
        ...useMemo(
            () => ({
                closeVaultSelect: () => setModalState((state) => ({ ...state, open: false })),
                openVaultSelect: (shareId: string) => setModalState({ shareId, open: true }),
            }),
            []
        ),
    };
};
