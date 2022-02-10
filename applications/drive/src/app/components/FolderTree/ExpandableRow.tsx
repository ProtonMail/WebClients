import { ReactNode } from 'react';

import { Icon, Button, classnames, TableRowBusy, FileIcon, FileNameDisplay } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

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
                className={classnames(['folder-tree-list-item cursor-pointer', isSelected && 'bg-strong'])}
                onClick={handleSelect}
            >
                <td style={paddingElement} className="flex flex-align-items-center flex-nowrap m0 pl-custom">
                    <div className="folder-tree-list-item-expand flex-item-noshrink relative">
                        <Button
                            disabled={isDisabled}
                            style={{ visibility: link.type === LinkType.FILE ? 'hidden' : 'visible' }}
                            className="folder-tree-list-item-expand-button increase-click-surface"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.blur();
                                toggleExpand(link.linkId);
                            }}
                        >
                            <Icon size={12} name="angle-down" className={isExpanded ? 'rotateX-180' : undefined} />
                        </Button>
                    </div>
                    <div
                        key="Name"
                        className="folder-tree-list-item-name flex flex-align-items-center flex-nowrap w100"
                    >
                        <FileIcon
                            mimeType={link.type === LinkType.FOLDER ? 'Folder' : link.mimeType}
                            className="mr0-5"
                        />
                        <FileNameDisplay text={link.name} />
                    </div>
                    {isSelected && (
                        <div className="folder-tree-list-item-selected flex flex-item-noshrink">
                            <span className="inline-flex bg-primary rounded-50 folder-tree-list-item-selected-check">
                                <Icon name="check" className="p0-25" size={16} />
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
