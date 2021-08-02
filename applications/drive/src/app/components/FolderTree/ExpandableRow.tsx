import React, { useState, ReactNode, useEffect } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, Button, LinkButton, classnames, TableRowBusy, FileIcon } from '@proton/components';
import { LinkType } from '../../interfaces/link';

interface Props {
    linkId: string;
    name: string;
    depth: number;
    type: LinkType;
    mimeType: string;
    disabled?: boolean;
    isSelected: boolean;
    isExpanded: boolean;
    onSelect: (LinkID: string) => void;
    loadChildren: (LinkID: string, loadNextPage?: boolean) => Promise<void>;
    childrenComplete: boolean;
    children?: ReactNode;
}

const ExpandableRow = ({
    linkId,
    name,
    depth,
    type,
    mimeType,
    disabled = false,
    isSelected,
    isExpanded,
    onSelect,
    loadChildren,
    childrenComplete,
    children,
}: Props) => {
    const [expanded, setExpanded] = useState(isExpanded);
    const [loadingChildren, withLoadingChildren] = useLoading();

    const handleExpand = (linkId: string) => {
        if (!expanded) {
            withLoadingChildren(loadChildren(linkId)).catch(console.error);
        }

        setExpanded(!expanded);
    };

    const handleLoadMore = (linkId: string) => () => {
        withLoadingChildren(loadChildren(linkId, true)).catch(console.error);
    };

    const handleSelect = (linkId: string) => () => {
        if (disabled) {
            return;
        }

        onSelect(linkId);
    };

    useEffect(() => {
        if (isExpanded && !expanded) {
            handleExpand(linkId);
        }
    }, [isExpanded]);

    const paddingLeft = `${depth * 1.5}em`;
    const viewMorePadding = { paddingLeft: `${(depth + 1) * 1.5}em` };
    const viewMoreRow = !childrenComplete ? (
        <tr>
            <td style={viewMorePadding}>
                <LinkButton className="ml0-5" onClick={handleLoadMore(linkId)}>
                    {c('Action').t`View more`}
                </LinkButton>
            </td>
        </tr>
    ) : null;

    return (
        <>
            <tr
                className={classnames(['folder-tree-list-item cursor-pointer', isSelected && 'bg-strong'])}
                onClick={handleSelect(linkId)}
            >
                <td style={{ paddingLeft }} className="flex flex-align-items-center flex-nowrap m0">
                    <div className="folder-tree-list-item-expand flex-item-noshrink relative">
                        <Button
                            disabled={disabled}
                            style={{ visibility: type === LinkType.FILE ? 'hidden' : 'visible' }}
                            className="folder-tree-list-item-expand-button increase-click-surface"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.blur();
                                handleExpand(linkId);
                            }}
                        >
                            <Icon size={12} name="caret" className={expanded ? 'rotateX-180' : undefined} />
                        </Button>
                    </div>
                    <div
                        key="Name"
                        className="folder-tree-list-item-name flex flex-align-items-center flex-nowrap w100"
                    >
                        <FileIcon mimeType={type === LinkType.FOLDER ? 'Folder' : mimeType} />
                        <span className="text-ellipsis text-pre" title={name}>
                            {name}
                        </span>
                    </div>
                    {isSelected && (
                        <div className="folder-tree-list-item-selected flex flex-item-noshrink">
                            <span className="inline-flex bg-primary rounded50 folder-tree-list-item-selected-check">
                                <Icon name="on" className="p0-25" size={16} />
                            </span>
                        </div>
                    )}
                </td>
            </tr>
            {expanded && (
                <>
                    {children}
                    {loadingChildren ? <TableRowBusy /> : viewMoreRow}
                </>
            )}
        </>
    );
};

export default ExpandableRow;
