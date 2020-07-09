import React, { useState, ReactNode, useEffect } from 'react';
import { c } from 'ttag';

import { Icon, useLoading, Button, LinkButton, classnames, TableRowBusy } from 'react-components';

import FileIcon from '../FileIcon/FileIcon';

interface Props {
    linkId: string;
    name: string;
    depth: number;
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
                className={classnames(['pd-folder-tree-listItem cursor-pointer', isSelected && 'bg-global-highlight'])}
                onClick={handleSelect(linkId)}
            >
                <td style={{ paddingLeft }} className="flex flex-items-center flex-nowrap m0">
                    <div className="pd-folder-tree-listItem-expand flex-item-noshrink relative">
                        <Button
                            disabled={disabled}
                            className="pd-folder-tree-listItem-expand-button increase-surface-click"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.currentTarget.blur();
                                handleExpand(linkId);
                            }}
                        >
                            <Icon size={12} name="caret" className={expanded ? 'rotateX-180' : undefined} />
                        </Button>
                    </div>
                    <div key="Name" className="pd-folder-tree-listItem-name flex flex-items-center flex-nowrap w100">
                        <FileIcon mimeType="Folder" />
                        <span className="ellipsis" title={name}>
                            {name}
                        </span>
                    </div>
                    {isSelected && (
                        <div className="pd-folder-tree-listItem-selected flex flex-item-noshrink">
                            <span className="inline-flex bg-pm-blue rounded50 pd-folder-tree-listItem-selected-check">
                                <Icon name="on" className="stroke-global-light p0-25" size={16} />
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
