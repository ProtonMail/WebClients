import React, { useState } from 'react';

import { CircleLoader } from '@proton/atoms';
import { FileIcon, Icon, Radio, useErrorHandler } from '@proton/components';
import clsx from '@proton/utils/clsx';
import orderBy from '@proton/utils/orderBy';

import './DirectoryTree.scss';

export interface DirectoryTreeItem {
    uid: string;
    name: string;
    expanded: boolean;
    expandable: boolean;
    type: 'folder' | string;
}

type ExpandFunction = (uid: string) => Promise<void>;
type GetChildrenOfFunction = (uid: string) => DirectoryTreeItem[];
type SelectItemFunction = (selected: DirectoryTreeItem) => void;

export function DirectoryTree({
    items,
    toggleExpand,
    getChildrenOf,
    onSelect,
    selectedItemUid,
}: {
    items: DirectoryTreeItem[];
    toggleExpand: ExpandFunction;
    getChildrenOf: GetChildrenOfFunction;
    onSelect: SelectItemFunction;
    selectedItemUid: string;
}) {
    return (
        <div className="border rounded" style={{ position: 'relative' }}>
            <DirectoryTreeTrunk
                items={items}
                toggleExpand={toggleExpand}
                getChildrenOf={getChildrenOf}
                onSelect={onSelect}
                selectedItemUid={selectedItemUid}
                isExpanded={true}
            />
        </div>
    );
}

function DirectoryTreeTrunk({
    items,
    toggleExpand,
    isExpanded,
    getChildrenOf,
    onSelect,
    selectedItemUid,
    isLoading,
}: {
    items: DirectoryTreeItem[];
    toggleExpand: ExpandFunction;
    isExpanded: boolean;
    getChildrenOf: GetChildrenOfFunction;
    onSelect: SelectItemFunction;
    selectedItemUid: string;
    isLoading?: boolean;
}) {
    if (isLoading) {
        return (
            <div className="p-2 w-full text-center">
                <CircleLoader />
            </div>
        );
    }

    if (!isExpanded) {
        return null;
    }

    return (
        <ul className="unstyled mt-0">
            {items.map((item) => (
                <DirectoryTreeBranch
                    key={item.uid}
                    item={item}
                    toggleExpand={toggleExpand}
                    getChildrenOf={getChildrenOf}
                    onSelect={onSelect}
                    selectedItemUid={selectedItemUid}
                />
            ))}
        </ul>
    );
}

function DirectoryTreeBranch({
    item,
    toggleExpand,
    getChildrenOf,
    onSelect,
    selectedItemUid,
}: {
    item: DirectoryTreeItem;
    toggleExpand: ExpandFunction;
    getChildrenOf: GetChildrenOfFunction;
    onSelect: (selected: DirectoryTreeItem) => void;
    selectedItemUid: string;
}) {
    const handleError = useErrorHandler();

    const isSelected = selectedItemUid === item.uid;

    const [isLoading, setIsLoading] = useState(false);
    const handleExpand = () => {
        setIsLoading(true);
        toggleExpand(item.uid)
            .then(() => setIsLoading(false))
            .catch(handleError);
    };

    const handleSelect = () => onSelect(item);

    return (
        <li key={item.uid} className="pl-4">
            {/* Keyboard accessibility is provided by the Radio component inside, so no need for onKeyDown here */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="directory-tree-node flex items-center p-2 cursor-pointer" onClick={handleSelect}>
                <Radio
                    id={item.uid}
                    name={item.uid}
                    onChange={handleSelect}
                    aria-selected={isSelected}
                    checked={isSelected}
                    className={clsx('absolute left-0 ml-2', !isSelected && 'opacity-0')}
                />

                <div className="flex items-center gap-4 pl-6">
                    <FileIcon mimeType={item.type === 'folder' ? 'Folder' : ''} />

                    {item.expandable && (
                        <button className={item.expanded ? 'rotateX-180' : ''} onClick={handleExpand}>
                            <Icon name="chevron-down" className="border border-norm rounded-50" />
                        </button>
                    )}

                    {item.name}
                </div>
            </div>

            {/* Border: can't be done with normal CSS because parent element visually indent the component */}
            <div className="absolute left-0 w-full h-px bg-strong"></div>

            <DirectoryTreeTrunk
                items={orderBy(getChildrenOf(item.uid), 'name')}
                toggleExpand={toggleExpand}
                isExpanded={item.expanded}
                getChildrenOf={getChildrenOf}
                onSelect={onSelect}
                selectedItemUid={selectedItemUid}
                isLoading={isLoading}
            />
        </li>
    );
}
