import type { ReactNode } from 'react';
import React, { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FileIcon, Icon, TableRowBusy, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { DecryptedLink } from '../../store';
import FloatingEllipsis from './FloatingEllipsis';

interface Props {
    link: DecryptedLink;
    depth: number;
    isDisabled?: boolean;
    isSelected: boolean;
    isExpanded: boolean;
    isLoaded: boolean;
    onSelect: (link: DecryptedLink) => void;
    toggleExpand: (linkId: string) => void;
    children?: ReactNode;
}

const ExpandableRow = ({
    link,
    depth,
    isDisabled = false,
    isSelected,
    isExpanded,
    isLoaded,
    onSelect,
    toggleExpand,
    children,
}: Props) => {
    const handleSelect = () => {
        if (isDisabled) {
            return;
        }
        onSelect(link);
    };

    const paddingElement = { width: `${depth * 1.5}em` };

    const floatingEllipsisVisibilityControlRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <tr
                className={clsx(['folder-tree-list-item', !isDisabled && 'cursor-pointer', isSelected && 'bg-strong'])}
                onClick={handleSelect}
            >
                <td className="flex items-center flex-nowrap m-0 pl-custom relative">
                    <div
                        className={clsx([
                            `folder-tree-list-item-selected flex shrink-0`,
                            !isSelected && 'folder-tree-list-item-selected-hidden',
                        ])}
                    >
                        <span className="flex justify-center items-center w-8 h-8 bg-primary rounded-full">
                            <Icon name="checkmark" className="p-1" size={4} />
                        </span>
                    </div>
                    <div className="flex shrink-0 folder-tree-list-item-indent" style={paddingElement}></div>
                    <div className="folder-tree-list-item-expand shrink-0 relative">
                        <Button
                            disabled={isDisabled}
                            style={{ visibility: link.isFile ? 'hidden' : 'visible' }}
                            className="folder-tree-list-item-expand-button expand-click-area"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.blur();
                                toggleExpand(link.linkId);
                            }}
                        >
                            <Icon
                                size={3}
                                name="chevron-down"
                                alt={isExpanded ? c('Action').t`Collapse` : c('Action').t`Expand`}
                                className={isExpanded ? 'rotateX-180' : undefined}
                            />
                        </Button>
                    </div>
                    <div key="Name" className="folder-tree-list-item-name flex items-center flex-nowrap w-full">
                        <FileIcon mimeType={link.isFile ? link.mimeType : 'Folder'} className="mr-2" />
                        <Tooltip title={link.name} originalPlacement="bottom">
                            <span ref={floatingEllipsisVisibilityControlRef} className="text-nowrap pr-8">
                                {link.name}
                            </span>
                        </Tooltip>
                    </div>
                    <FloatingEllipsis visibilityControlRef={floatingEllipsisVisibilityControlRef} />
                </td>
            </tr>
            {isExpanded && (
                <>
                    {children}
                    {!isLoaded && <TableRowBusy />}
                </>
            )}
        </>
    );
};

export default ExpandableRow;
