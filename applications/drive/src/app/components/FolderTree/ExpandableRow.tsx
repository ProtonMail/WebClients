import React, { useState, ReactNode } from 'react';
import { c } from 'ttag';

import { Icon, useLoading, Button, LinkButton, classnames, TableRowBusy } from 'react-components';

import MimeIcon from '../FileIcon';

interface Props {
    linkId: string;
    name: string;
    depth: number;
    disabled?: boolean;
    isSelected: boolean;
    isExpanded?: boolean;
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
    isExpanded = false,
    onSelect,
    loadChildren,
    childrenComplete,
    children
}: Props) => {
    const [expanded, setExpanded] = useState(isExpanded);
    const [loadingChildren, withLoadingChildren] = useLoading();

    const handleExpand = (linkId: string) => {
        if (!expanded) {
            withLoadingChildren(loadChildren(linkId));
        }

        setExpanded(!expanded);
    };

    const handleLoadMore = (linkId: string) => () => {
        withLoadingChildren(loadChildren(linkId, true));
    };

    const handleSelect = (linkId: string) => () => {
        if (disabled) {
            return;
        }
        onSelect(linkId);
    };

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
                className={classnames(['cursor-pointer', isSelected && 'bg-global-highlight'])}
                onClick={handleSelect(linkId)}
            >
                <td style={{ paddingLeft }} className="flex flex-items-center flex-nowrap m0">
                    <div className="flex-item-noshrink pl0-5 pr0-5">
                        <Button
                            disabled={disabled}
                            className="pd-folder-tree-listItem-button"
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
                        <MimeIcon mimeType="Folder" />
                        <span className="ellipsis" title={name}>
                            {name}
                        </span>
                    </div>
                    {isSelected && (
                        <div className="pd-folder-tree-listItem-selected flex-item-noshrink pl0-5 pr0-5">
                            <Icon name="check-circle" size={20} />
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
