import React, { useState } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { FileIcon, Radio, useErrorHandler } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import orderBy from '@proton/utils/orderBy';

import './DirectoryTree.scss';

export interface DirectoryTreeItem {
    nodeUid: string;
    treeItemId: string;
    name: string;
    expandable: boolean;
    type: 'files-root' | 'devices-root' | 'device' | 'shares-root' | 'folder' | string;
    children: Record<string, DirectoryTreeItem> | null;
}

type SelectItemFunction = (selected: string, item: any) => void;
type ToggleExpandFunction = (treeItemId: string) => Promise<void>;

export function DirectoryTreeRoot({
    roots,
    toggleExpand,
    selectedTreeId,
    onSelect,
}: {
    roots: DirectoryTreeItem[];
    toggleExpand: ToggleExpandFunction;
    selectedTreeId?: string;
    onSelect: SelectItemFunction;
}) {
    if (!roots) {
        return null;
    }

    return (
        <div className="border rounded" style={{ position: 'relative' }}>
            <ul className="unstyled mt-0">
                {roots.map((root) => (
                    <DirectoryTreeBranch
                        key={root.treeItemId}
                        item={root}
                        toggleExpand={toggleExpand}
                        selectedTreeId={selectedTreeId}
                        onSelect={onSelect}
                    />
                ))}
            </ul>
        </div>
    );
}

function DirectoryTree({
    tree,
    toggleExpand,
    selectedTreeId,
    onSelect,
}: {
    tree: Record<string, DirectoryTreeItem>;
    toggleExpand: ToggleExpandFunction;
    selectedTreeId?: string;
    onSelect: SelectItemFunction;
}) {
    return (
        <ul className="unstyled mt-0">
            {orderBy(Object.values(tree), 'name').map((item) => (
                <DirectoryTreeBranch
                    key={item.treeItemId}
                    item={item}
                    toggleExpand={toggleExpand}
                    selectedTreeId={selectedTreeId}
                    onSelect={onSelect}
                />
            ))}
        </ul>
    );
}

function DirectoryTreeBranch({
    item,
    toggleExpand,
    selectedTreeId,
    onSelect,
}: {
    item: DirectoryTreeItem;
    toggleExpand: ToggleExpandFunction;
    selectedTreeId?: string;
    onSelect: SelectItemFunction;
}) {
    const handleError = useErrorHandler();

    const [isLoading, setIsLoading] = useState(false);
    const handleExpand = () => {
        setIsLoading(true);
        toggleExpand(item.treeItemId)
            .catch(handleError)
            .finally(() => setIsLoading(false));
    };

    const isSelected = selectedTreeId === item.treeItemId;
    const handleSelect = () => onSelect(item.treeItemId, item);

    return (
        <li className="pl-4">
            {/* Keyboard accessibility is provided by the Radio component inside, so no need for onKeyDown here */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="directory-tree-node flex items-center p-2 cursor-pointer" onClick={handleSelect}>
                <Radio
                    id={item.treeItemId}
                    name={item.treeItemId}
                    onChange={handleSelect}
                    aria-selected={isSelected}
                    checked={isSelected}
                    className={clsx('absolute left-0 ml-2', !isSelected && 'opacity-0')}
                    data-testid={isSelected ? 'copy-destination-selected' : 'copy-destination-not-selected'}
                />

                <div className="flex items-center gap-4 pl-6">
                    <TreeItemIcon type={item.type} />

                    {item.expandable && (
                        <button
                            // Null children means collapsed
                            className={item.children === null ? 'rotateX-180' : ''}
                            onClick={handleExpand}
                            disabled={isLoading}
                        >
                            <Icon name="chevron-up" className="border border-norm rounded-50" />
                        </button>
                    )}

                    {item.name}
                </div>
            </div>

            {/* Border: can't be done with normal CSS because parent element visually indent the component */}
            <div className="absolute left-0 w-full h-px bg-strong"></div>

            {isLoading && (
                <div className="p-2 w-full text-center">
                    <CircleLoader />
                </div>
            )}

            {item.children !== null && (
                <DirectoryTree
                    tree={item.children}
                    toggleExpand={toggleExpand}
                    selectedTreeId={selectedTreeId}
                    onSelect={onSelect}
                />
            )}
        </li>
    );
}

function TreeItemIcon({ type }: { type: string }) {
    if (type === 'files-root') {
        return <Icon name="inbox" />;
    }
    if (type === 'devices-root' || type === 'device') {
        return <Icon name="tv" />;
    }
    if (type === 'shares-root') {
        return <Icon name="users" />;
    }
    if (type === 'folder') {
        return <FileIcon mimeType={'Folder'} />;
    }
    return <Icon name="file" />;
}
