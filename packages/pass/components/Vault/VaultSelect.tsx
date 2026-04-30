import { type FC, type ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { RadioButtonGroup, RadioLabelledButton } from '@proton/pass/components/Form/Field/RadioButtonGroupField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { UpsellRef } from '@proton/pass/constants';
import type { VaultShareItem, WithItemCount } from '@proton/pass/store/reducers';
import {
    selectVaultLimits,
    selectWritableSharedVaultsWithCount,
    selectWritableVaultsWithCount,
} from '@proton/pass/store/selectors';
import { NOOP_LIST_SELECTOR } from '@proton/pass/store/selectors/utils';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';
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
    [VaultSelectMode.Writable]: selectWritableVaultsWithCount,
    [VaultSelectMode.Shared]: selectWritableSharedVaultsWithCount,
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
                        title={title && <h3>{title}</h3>}
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="shrink-0"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
                            </Button>,
                            ...(didDowngrade
                                ? [<UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_VAULT} />]
                                : []),
                        ]}
                    />
                }
            >
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

type VaultSelectState = Pick<VaultSelectProps, 'shareId' | 'open' | 'mode' | 'onSubmit' | 'title'>;

export const useVaultSelectModalHandles = () => {
    const [modalState, setModalState] = useState<VaultSelectState>({
        mode: null,
        open: false,
        shareId: '',
        onSubmit: noop,
        title: undefined,
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
                        title: undefined,
                    })),
                openVaultSelect: (options: Omit<VaultSelectState, 'open'>) => setModalState({ ...options, open: true }),
            }),
            []
        ),
    };
};

export type VaultMultiSelectProps = {
    vaults: VaultShareItem[];
    selectedShareIds: Set<string>;
    onToggle: (shareId: string) => void;
    /** CSS max-height applied to the scrollable list. */
    maxHeight?: string;
    /** Rendered when `vaults` is empty. */
    emptyState?: ReactNode;
};

/** Inline multi-select list of vaults — a checkbox companion to the
 * single-select sidebar `VaultSelect` above. The caller owns the surrounding
 * layout (typically another modal) and supplies the vault list, so this
 * component is intentionally vault-source-agnostic. */
export const VaultMultiSelect: FC<VaultMultiSelectProps> = ({
    vaults,
    selectedShareIds,
    onToggle,
    maxHeight,
    emptyState,
}) => {
    if (vaults.length === 0) {
        return <div className="text-sm color-weak">{emptyState ?? c('pass_2026: Info').t`No vaults available.`}</div>;
    }

    return (
        <div
            className={clsx('rounded border border-weak overflow-auto', maxHeight && 'max-h-custom')}
            {...(maxHeight ? { style: { '--max-h-custom': maxHeight } } : {})}
        >
            <Scroll>
                <div className="flex flex-column flex-nowrap gap-2 my-2">
                    {vaults.map((vault) => {
                        const checked = selectedShareIds.has(vault.shareId);
                        return (
                            <label
                                key={vault.shareId}
                                className="flex flex-nowrap items-center gap-2 px-3 py-1 cursor-pointer hover:bg-weak"
                            >
                                <Checkbox
                                    checked={checked}
                                    onChange={() => onToggle(vault.shareId)}
                                    className="shrink-0"
                                />
                                <VaultIcon
                                    color={vault.content.display.color}
                                    icon={vault.content.display.icon}
                                    size={3}
                                    background
                                    className="shrink-0"
                                />
                                <span className="text-ellipsis">{vault.content.name}</span>
                            </label>
                        );
                    })}
                </div>
            </Scroll>
        </div>
    );
};
