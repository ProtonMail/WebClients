import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import FileNameDisplay from '@proton/components/components/fileNameDisplay/FileNameDisplay';
import Icon from '@proton/components/components/icon/Icon';
import SidebarListItem from '@proton/components/components/sidebar/SidebarListItem';
import SidebarListItemContent from '@proton/components/components/sidebar/SidebarListItemContent';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useItemDrop } from '../../hooks/useItemDrag';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { intoBulkSelection } from '../../lib/items/item.utils';
import { isWritableVault } from '../../lib/vaults/vault.predicates';
import { selectChildFolders, selectFolderPath, selectShare } from '../../store/selectors';
import type { UniqueItem } from '../../types';
import { useItemsActions } from '../Item/ItemActionsProvider';
import { MaybeTooltip } from '../Layout/Tooltip/MaybeTooltip';
import { useSelectFolder } from '../Navigation/NavigationActions';
import { useNavigationFilters } from '../Navigation/NavigationFilters';
import { PassExpandButton } from './PassExpandButton';
import { PassFolderActions } from './PassFolderActions';
import { PassFolderIcon } from './PassFolderIcon';
import { useFolderCreate } from './useFolderCreate';
import { useFoldersAccess } from './useFoldersAccess';

import './PassSidebarFolder.scss';

type Props = {
    folderId: string;
    shareId: string;
    name: string;
    level?: number;
    onAction?: () => void;
};

export const PassSidebarFolder: FC<Props> = ({ folderId, shareId, name, level = 1, onAction = noop }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOptionDropdownOpened, setIsOptionDropdownOpened] = useState(false);

    const folderCreate = useFolderCreate(shareId, folderId);
    const { canUseFolders } = useFoldersAccess();
    const selectFolder = useSelectFolder();
    const { filters } = useNavigationFilters();
    const isSelected = filters.selectedFolderId === folderId;
    const childFolders = useMemoSelector(selectChildFolders, [shareId, folderId]);
    const hasChildren = childFolders.length > 0;
    const selectedPath = useMemoSelector(selectFolderPath, [shareId, filters.selectedFolderId]);
    const hasSelectedDescendant = !isSelected && selectedPath.some((folder) => folder.folderId === folderId);

    const share = useSelector(selectShare(shareId));
    const canManageFolders = Boolean(share && isWritableVault(share));

    const { moveMany } = useItemsActions();

    const dropParams = useMemo(() => {
        const onDrop = (items: UniqueItem[]) => moveMany(intoBulkSelection(items), shareId, folderId);
        const dragFilter = () => canUseFolders && Boolean(share && isWritableVault(share));
        return [onDrop, dragFilter] as const;
    }, [share, shareId, folderId, canUseFolders]);

    const { dragOver, dragProps } = useItemDrop(...dropParams);

    /** Automatically expand to selected folder */
    useEffect(() => {
        if (hasSelectedDescendant) setIsExpanded(true);
    }, [hasSelectedDescendant]);

    const handleToggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleFolderClick = () => {
        if (!isSelected) selectFolder(shareId, folderId);
        onAction();
    };

    const paddingLeft = level * 12;

    return (
        <>
            <SidebarListItem
                itemClassName="navigation-item"
                className={clsx('group-hover-hide-container group-hover-opacity-container')}
            >
                {/* eslint-disable-next-line */}
                <a
                    className={clsx('navigation-link pass-folder-item', (isSelected || dragOver) && 'is-selected')}
                    onClick={handleFolderClick}
                    onDoubleClick={handleToggleExpand}
                    aria-label={name}
                    aria-current={isSelected ? 'page' : undefined}
                    {...dragProps}
                >
                    <SidebarListItemContent
                        right={
                            <span
                                className={clsx(
                                    'group-hover:opacity-100 group-hover:opacity-100-no-width shrink-0 flex mr-custom right-custom gap-1',
                                    isOptionDropdownOpened && 'is-active'
                                )}
                                style={{
                                    '--mr-custom': 'calc(var(--space-1) * -1)',
                                    '--right-custom': 'var(--space-2)',
                                }}
                            >
                                {canManageFolders && folderCreate.canShow && (
                                    <MaybeTooltip active={folderCreate.limitReached} title={folderCreate.limitReason}>
                                        <Button
                                            shape="ghost"
                                            size="small"
                                            icon
                                            disabled={folderCreate.limitReached}
                                            className="rounded-sm"
                                            title={
                                                folderCreate.limitReached ? undefined : c('Action').t`Create new folder`
                                            }
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                folderCreate.onCreate();
                                            }}
                                        >
                                            <Icon name="folder-plus" alt={c('Action').t`Create new folder`} />
                                        </Button>
                                    </MaybeTooltip>
                                )}
                                {canManageFolders && (
                                    <PassFolderActions
                                        shareId={shareId}
                                        folderId={folderId}
                                        folderName={name}
                                        onToggleDropdown={setIsOptionDropdownOpened}
                                    />
                                )}
                            </span>
                        }
                    >
                        <div
                            className="flex flex-nowrap items-center gap-2 min-w-0"
                            style={{ paddingLeft: `${paddingLeft}px` }}
                        >
                            <PassExpandButton
                                expanded={isExpanded}
                                onClick={handleToggleExpand}
                                hidden={!hasChildren}
                            />
                            <PassFolderIcon hasChildren={hasChildren} />
                            <FileNameDisplay text={name} className="min-w-0" />
                        </div>
                    </SidebarListItemContent>
                </a>
            </SidebarListItem>

            {isExpanded &&
                childFolders.map((child) => (
                    <PassSidebarFolder
                        key={child.folderId}
                        folderId={child.folderId}
                        shareId={child.shareId}
                        name={child.name}
                        level={level + 1}
                        onAction={onAction}
                    />
                ))}
        </>
    );
};
