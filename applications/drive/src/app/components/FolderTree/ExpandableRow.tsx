import React, { ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FileIcon, Icon, TableRowBusy, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { DecryptedLink } from '../../store';
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
                            `folder-tree-list-item-selected flex flex-item-noshrink`,
                            !isSelected && 'folder-tree-list-item-selected-hidden',
                        ])}
                    >
                        <span className="inline-flex bg-primary rounded-50 folder-tree-list-item-selected-check">
                            <Icon name="checkmark" className="p-1" size={16} />
                        </span>
                    </div>
                    <div className="flex flex-item-noshrink folder-tree-list-item-indent" style={paddingElement}></div>
                    <div className="folder-tree-list-item-expand flex-item-noshrink relative">
                        <Button
                            disabled={isDisabled}
                            style={{ visibility: link.isFile ? 'hidden' : 'visible' }}
                            className="folder-tree-list-item-expand-button increase-click-surface"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.blur();
                                toggleExpand(link.linkId);
                            }}
                        >
                            <Icon
                                size={12}
                                name="chevron-down"
                                alt={isExpanded ? c('Action').t`Collapse` : c('Action').t`Expand`}
                                className={isExpanded ? 'rotateX-180' : undefined}
                            />
                        </Button>
                    </div>
                    <div
                        key="Name"
                        className="folder-tree-list-item-name flex items-center flex-nowrap w-full"
                    >
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
