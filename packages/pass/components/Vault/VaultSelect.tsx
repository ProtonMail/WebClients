import { type VFC, useMemo, useState } from 'react';
import type { Selector } from 'react-redux';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { RadioButtonGroup, RadioLabelledButton } from '@proton/pass/components/Form/Field/RadioButtonGroupField';
import { ItemCard } from '@proton/pass/components/Item/ItemCard';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import type { VaultShareItem, WithItemCount } from '@proton/pass/store/reducers';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import { NOOP_LIST_SELECTOR } from '@proton/pass/store/selectors/utils';
import type { State } from '@proton/pass/store/types';

type OptionsSelector = Selector<State, WithItemCount<VaultShareItem>[]>;

export type Props = Omit<ModalProps, 'onSubmit'> & {
    downgradeMessage: string;
    onSubmit: (shareId: string) => void;
    optionsSelector: OptionsSelector;
    shareId: string;
    title?: string;
};

/* if the user has downgraded : only allow him to select
 * his writable vaults as target. This rule applies when moving
 * an item to a vault or when selecting an item's vault */
export const VaultSelect: VFC<Props> = ({ downgradeMessage, onSubmit, optionsSelector, shareId, title, ...props }) => {
    const vaults = useSelector(optionsSelector);
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
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,
                            ...(didDowngrade ? [<UpgradeButton key="upgrade-button" />] : []),
                        ]}
                    />
                }
            >
                {title && <div className="mb-2 text-bold text-xl">{title}</div>}
                {didDowngrade && <ItemCard>{downgradeMessage}</ItemCard>}

                <RadioButtonGroup name="vault-select" className="flex-columns" value={shareId} onChange={onSubmit}>
                    {sortedVaults.map((vault) => (
                        <RadioLabelledButton
                            value={vault.shareId}
                            key={vault.shareId}
                            disabled={vault.shareId === shareId}
                        >
                            <VaultIcon
                                size={20}
                                background
                                color={vault.content.display.color}
                                icon={vault.content.display.icon}
                            />
                            <div className="flex flex-item-fluid flex-column">
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

export const useVaultSelectModalHandles = () => {
    const [modalState, setModalState] = useState<Pick<Props, 'shareId' | 'open' | 'optionsSelector'>>({
        open: false,
        shareId: '',
        optionsSelector: NOOP_LIST_SELECTOR,
    });

    return {
        modalState,
        ...useMemo(
            () => ({
                closeVaultSelect: () =>
                    setModalState((state) => ({
                        ...state,
                        open: false,
                        optionsSelector: NOOP_LIST_SELECTOR,
                    })),
                openVaultSelect: (shareId: string, optionsSelector: OptionsSelector) =>
                    setModalState({
                        shareId,
                        open: true,
                        optionsSelector,
                    }),
            }),
            []
        ),
    };
};
