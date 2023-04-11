import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FileIcon, FileNameDisplay, Icon, TableRowBusy } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { DecryptedLink } from '../../store';

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

    const paddingElement = { '--padding-left-custom': `${depth * 1.5}em` };

    return (
        <>
            <tr
                className={clsx(['folder-tree-list-item', !isDisabled && 'cursor-pointer', isSelected && 'bg-strong'])}
                onClick={handleSelect}
            >
                <td style={paddingElement} className="flex flex-align-items-center flex-nowrap m-0 pl-custom">
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
                        className="folder-tree-list-item-name flex flex-align-items-center flex-nowrap w100"
                    >
                        <FileIcon mimeType={link.isFile ? link.mimeType : 'Folder'} className="mr-2" />
                        <FileNameDisplay text={link.name} />
                    </div>
                    {isSelected && (
                        <div className="folder-tree-list-item-selected flex flex-item-noshrink">
                            <span className="inline-flex bg-primary rounded-50 folder-tree-list-item-selected-check">
                                <Icon name="checkmark" className="p0-25" size={16} />
                            </span>
                        </div>
                    )}
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
