import { type FC, type ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { UpsellRef } from '../../constants';
import { fromFolderKey, getFolderKey } from '../../lib/items/item.utils';
import type { VaultShareItem, WithItemCount } from '../../store/reducers';
import {
    selectFolders,
    selectVaultLimits,
    selectWritableSharedVaultsWithCount,
    selectWritableVaultsWithCount,
} from '../../store/selectors';
import { NOOP_LIST_SELECTOR } from '../../store/selectors/utils';
import type { MaybeNull } from '../../types';
import { PassExpandButton } from '../Folders/PassExpandButton';
import { PassFolderIcon } from '../Folders/PassFolderIcon';
import { useFoldersAccess } from '../Folders/useFoldersAccess';
import { RadioButtonGroup, RadioLabelledButton } from '../Form/Field/RadioButtonGroupField';
import { Card } from '../Layout/Card/Card';
import { SidebarModal } from '../Layout/Modal/SidebarModal';
import { Panel } from '../Layout/Panel/Panel';
import { PanelHeader } from '../Layout/Panel/PanelHeader';
import { UpgradeButton } from '../Upsell/UpgradeButton';
import { VaultIcon } from './VaultIcon';
import type { VaultFolderRow } from './folderView.utils';
import { buildVaultFolderRows } from './folderView.utils';
import { useFolderTreeExpand } from './useFolderTreeExpand';

export enum VaultSelectMode {
    Writable = 1,
    Shared = 2,
}

export type VaultSelectProps = Omit<ModalProps, 'onSubmit'> & {
    downgradeMessage?: string;
    mode: MaybeNull<VaultSelectMode>;
    shareId?: string;
    folderId?: MaybeNull<string>;
    showFolders?: boolean;
    title?: string;
    onSubmit: (shareId: string, folderId: MaybeNull<string>) => void;
};

const vaultSelector = {
    [VaultSelectMode.Writable]: selectWritableVaultsWithCount,
    [VaultSelectMode.Shared]: selectWritableSharedVaultsWithCount,
};

/* if the user has downgraded : only allow him to select
 * his writable vaults as target. This rule applies when moving
 * an item to a vault or when selecting an item's vault */
export const VaultSelect: FC<VaultSelectProps> = ({
    downgradeMessage,
    mode,
    shareId,
    folderId,
    showFolders,
    title,
    onSubmit,
    ...props
}) => {
    const vaults = useSelector(mode ? vaultSelector[mode] : NOOP_LIST_SELECTOR<WithItemCount<VaultShareItem>>);
    const { didDowngrade } = useSelector(selectVaultLimits);
    const folders = useSelector(selectFolders);
    const { canUseFolders } = useFoldersAccess();
    const withFolders = canUseFolders && Boolean(showFolders);

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

    const { expandedKeys, toggle } = useFolderTreeExpand(folders, shareId ?? null, folderId ?? null);

    const rows = useMemo<VaultFolderRow<WithItemCount<VaultShareItem>>[]>(
        () => buildVaultFolderRows(sortedVaults, folders, withFolders, expandedKeys),
        [sortedVaults, folders, withFolders, expandedKeys]
    );

    const currentKey = getFolderKey(shareId ?? '', folderId ?? null);

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

                <RadioButtonGroup
                    name="vault-select"
                    className="flex-column"
                    value={currentKey}
                    onChange={(key: string) => {
                        const { shareId: nextShareId, folderId: nextFolderId } = fromFolderKey(key);
                        onSubmit(nextShareId, nextFolderId);
                    }}
                >
                    {rows.map((row) => {
                        const canExpand = row.type === 'vault' ? row.hasFolders : row.hasChildren;

                        const expandButton = withFolders && (
                            <PassExpandButton
                                expanded={row.expanded}
                                onClick={() => toggle(row.key)}
                                hidden={!canExpand}
                                /** `relative` puts the button above the label's expand-click-area
                                 * overlay, which would otherwise swallow the click */
                                className="relative"
                            />
                        );

                        return row.type === 'vault' ? (
                            <RadioLabelledButton value={row.key} key={row.key} disabled={row.key === currentKey}>
                                {expandButton}
                                <VaultIcon
                                    size={5}
                                    background
                                    color={row.vault.content.display.color}
                                    icon={row.vault.content.display.icon}
                                />
                                <div className="flex flex-1 min-w-0 flex-column">
                                    <span className="text-ellipsis inline-block max-w-full color-norm">
                                        {row.vault.content.name}
                                    </span>
                                    <span className="block color-weak">{row.vault.count} items</span>
                                </div>
                            </RadioLabelledButton>
                        ) : (
                            <RadioLabelledButton value={row.key} key={row.key} disabled={row.key === currentKey}>
                                <div
                                    className="flex flex-1 min-w-0 flex-nowrap items-center gap-x-3 ml-custom"
                                    style={{ '--ml-custom': `${row.depth * 0.75}rem` }}
                                >
                                    {expandButton}
                                    <PassFolderIcon hasChildren={row.hasChildren} size={5} />
                                    <span className="flex-1 min-w-0 text-ellipsis color-norm">{row.folder.name}</span>
                                </div>
                            </RadioLabelledButton>
                        );
                    })}
                </RadioButtonGroup>
            </Panel>
        </SidebarModal>
    );
};

type VaultSelectState = Pick<VaultSelectProps, 'shareId' | 'folderId' | 'open' | 'mode' | 'onSubmit' | 'title'>;

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
        return <div className="text-sm color-weak">{emptyState ?? c('Info').t`No vaults available.`}</div>;
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
