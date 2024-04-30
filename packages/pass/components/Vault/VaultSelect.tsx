import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { RadioButtonGroup, RadioLabelledButton } from '@proton/pass/components/Form/Field/RadioButtonGroupField';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { UpsellRef } from '@proton/pass/constants';
import type { VaultShareItem, WithItemCount } from '@proton/pass/store/reducers';
import {
    selectVaultLimits,
    selectWritableSharedVaultsWithItemsCount,
    selectWritableVaultsWithItemsCount,
} from '@proton/pass/store/selectors';
import { NOOP_LIST_SELECTOR } from '@proton/pass/store/selectors/utils';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export enum VaultSelectMode {
    Writable = 1,
    Shared,
}

export type VaultSelectProps = Omit<ModalProps, 'onSubmit'> & {
    downgradeMessage?: string;
    mode: MaybeNull<VaultSelectMode>;
    shareId?: string;
    title?: string;
    onSubmit: (shareId: string) => void;
};

const vaultSelector = {
    [VaultSelectMode.Writable]: selectWritableVaultsWithItemsCount,
    [VaultSelectMode.Shared]: selectWritableSharedVaultsWithItemsCount,
};

/* if the user has downgraded : only allow him to select
 * his writable vaults as target. This rule applies when moving
 * an item to a vault or when selecting an item's vault */
export const VaultSelect: FC<VaultSelectProps> = ({ downgradeMessage, mode, shareId, title, onSubmit, ...props }) => {
    const vaults = useSelector(mode ? vaultSelector[mode] : NOOP_LIST_SELECTOR<WithItemCount<VaultShareItem>>);
    const { didDowngrade } = useSelector(selectVaultLimits);

    const sortedVaults = useMemo(
        () =>
            /* make the current vault appear first in the list */
            vaults.slice().sort((a, b) => {
                if (a.shareId === shareId) return -1;
                else if (b.shareId === shareId) return 1;
                else return 0;
            }),
        [vaults]
    );

    return (
        <SidebarModal {...props}>
            <Panel
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="shrink-0"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,
                            ...(didDowngrade
                                ? [<UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_VAULT} />]
                                : []),
                        ]}
                    />
                }
            >
                {title && <div className="mb-2 text-bold text-xl">{title}</div>}
                {didDowngrade && downgradeMessage && (
                    <Card type="primary" className="text-sm">
                        {downgradeMessage}
                    </Card>
                )}

                <RadioButtonGroup name="vault-select" className="flex-column" value={shareId} onChange={onSubmit}>
                    {sortedVaults.map((vault) => (
                        <RadioLabelledButton
                            value={vault.shareId}
                            key={vault.shareId}
                            disabled={vault.shareId === shareId}
                        >
                            <VaultIcon
                                size={5}
                                background
                                color={vault.content.display.color}
                                icon={vault.content.display.icon}
                            />
                            <div className="flex flex-1 flex-column">
                                <span className="text-ellipsis inline-block max-w-full color-norm">
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

type VaultSelectState = Pick<VaultSelectProps, 'shareId' | 'open' | 'mode' | 'onSubmit'>;

export const useVaultSelectModalHandles = () => {
    const [modalState, setModalState] = useState<VaultSelectState>({
        mode: null,
        open: false,
        shareId: '',
        onSubmit: noop,
    });

    return {
        modalState,
        ...useMemo(
            () => ({
                closeVaultSelect: () =>
                    setModalState((state) => ({
                        ...state,
                        mode: null,
                        open: false,
                        onSubmit: noop,
                    })),
                openVaultSelect: (options: Omit<VaultSelectState, 'open'>) => setModalState({ ...options, open: true }),
            }),
            []
        ),
    };
};
