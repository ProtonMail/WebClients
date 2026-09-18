import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import { resolveFolderPath } from '../../../lib/folders/folder.utils';
import { fromFolderKey, getFolderKey } from '../../../lib/items/item.utils';
import type { FoldersByShareId, ShareItem } from '../../../store/reducers';
import type { MaybeNull, ShareType } from '../../../types';
import { PassExpandButton } from '../../Folders/PassExpandButton';
import { PassFolderIcon } from '../../Folders/PassFolderIcon';
import { FolderBreadcrumbCore } from '../../Vault/FolderBreadcrumbCore';
import { VaultIcon } from '../../Vault/VaultIcon';
import type { VaultFolderRow } from '../../Vault/folderView.utils';
import { buildVaultFolderRows } from '../../Vault/folderView.utils';
import { useFolderTreeExpand } from '../../Vault/useFolderTreeExpand';

import './VaultPickerField.scss';

type VaultFolderPickerFieldCoreProps = {
    vaults: ShareItem<ShareType.Vault>[];
    folders: FoldersByShareId;
    shareId: string;
    folderId: MaybeNull<string>;
    showFolders: boolean;
    onChange: (shareId: string, folderId: MaybeNull<string>) => void;
};

const DROPDOWN_SIZE = { width: DropdownSizeUnit.Dynamic, maxWidth: '20rem' } as const;

export const VaultFolderPickerFieldCore: FC<VaultFolderPickerFieldCoreProps> = ({
    vaults,
    folders,
    shareId,
    folderId,
    showFolders,
    onChange,
}) => {
    const { expandedKeys, toggle } = useFolderTreeExpand(folders, shareId, folderId);

    const rows = useMemo<VaultFolderRow<ShareItem<ShareType.Vault>>[]>(
        () => buildVaultFolderRows(vaults, folders, showFolders, expandedKeys),
        [vaults, folders, showFolders, expandedKeys]
    );

    const selectedVault = vaults.find((vault) => vault.shareId === shareId);
    const path = useMemo(() => resolveFolderPath(folders[shareId], folderId), [shareId, folderId, folders]);

    const hasFolders = rows.some((row) => row.type === 'vault' && row.hasFolders);
    /** Nothing to pick: a single vault with no folders */
    if (vaults.length <= 1 && !hasFolders) return null;

    return (
        <InputFieldTwo<typeof SelectTwo<string>>
            as={SelectTwo}
            unstyled
            dense
            size={DROPDOWN_SIZE}
            assistContainerClassName="empty:hidden"
            className="button button-pill button-medium button-outline border-weak"
            value={getFolderKey(shareId, folderId)}
            onValue={(value) => {
                const next = fromFolderKey(value);
                onChange(next.shareId, next.folderId);
            }}
            renderSelected={() => (
                <FolderBreadcrumbCore
                    shareId={shareId}
                    vaultName={selectedVault?.content.name ?? c('Placeholder').t`Pick a vault`}
                    vaultColor={selectedVault?.content.display.color}
                    vaultIcon={selectedVault?.content.display.icon}
                    path={path}
                />
            )}
        >
            {rows.map((row) => {
                const selected = row.key === getFolderKey(shareId, folderId);
                const canExpand = row.type === 'vault' ? row.hasFolders : row.hasChildren;

                const expandButton = (
                    <PassExpandButton
                        expanded={row.expanded}
                        onClick={() => toggle(row.key)}
                        hidden={!canExpand}
                        className="shrink-0"
                    />
                );

                return row.type === 'vault' ? (
                    <Option key={row.key} value={row.key} title={row.vault.content.name}>
                        <div className="flex flex-nowrap gap-x-2 items-center">
                            {showFolders && expandButton}
                            <VaultIcon
                                icon={row.vault.content.display.icon}
                                color={row.vault.content.display.color}
                                size={3.5}
                                highlighted={selected}
                            />
                            <span className="flex-1 min-w-0 text-ellipsis">{row.vault.content.name}</span>
                        </div>
                    </Option>
                ) : (
                    <Option key={row.key} value={row.key} title={row.folder.name}>
                        <div
                            className="flex flex-nowrap gap-x-2 items-center ml-custom"
                            style={{ '--ml-custom': `${row.depth * 0.75}rem` }}
                        >
                            {expandButton}
                            <PassFolderIcon hasChildren={row.hasChildren} />
                            <span className="flex-1 min-w-0 text-ellipsis">{row.folder.name}</span>
                        </div>
                    </Option>
                );
            })}
        </InputFieldTwo>
    );
};
