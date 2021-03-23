import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { order, getParents } from 'proton-shared/lib/helpers/folder';
import { orderFolders, updateLabel } from 'proton-shared/lib/api/labels';
import { ROOT_FOLDER } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { Icon, TreeViewContainer, TreeViewItem } from '../../components';
import { useApi, useLoading, useEventManager, useActiveBreakpoint } from '../../hooks';
import { classnames } from '../../helpers';
import ActionsLabel from './ActionsLabel';
import ToggleNotify from './ToggleNotify';
import FolderIcon from './FolderIcon';

const INSIDE = 'inside';
const AFTER = 'after';
const BEFORE = 'before';

const Header = ({ isNarrow }) => {
    return (
        <div className="flex flex-nowrap w100 border-bottom pb0-5">
            <span className="text-bold text-uppercase flex-item-fluid">
                {isNarrow ? null : <Icon name="arrow-cross" className="mr1" />}
                {c('Header').t`Name`}
            </span>
            <span className="text-bold text-uppercase w10e no-mobile">{c('Header').t`Notification`}</span>
            <span className="text-bold text-uppercase w10e text-right">{c('Header').t`Actions`}</span>
        </div>
    );
};

Header.propTypes = {
    isNarrow: PropTypes.bool,
};

const FolderTreeViewList = ({ items = [] }) => {
    const api = useApi();
    const { isNarrow } = useActiveBreakpoint();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [grabbed, setGrabbed] = useState();
    const [position, setPosition] = useState();
    const overRef = useRef({});
    const timeoutRef = useRef();
    const parents = getParents(items);
    const rootFolders = items.filter(({ ParentID = ROOT_FOLDER }) => ParentID === ROOT_FOLDER);

    const clear = () => {
        // Delay clear to execute onDrop first
        timeoutRef.current = setTimeout(() => {
            setGrabbed(null);
            setPosition(null);
            overRef.current = {};
        }, 200);
    };

    const buildTreeView = (items = [], level = 0) => {
        return (
            <TreeViewContainer>
                {order(items).map((item) => {
                    const isOverred = item.ID === overRef.current.ID;
                    const handleDrop = async () => {
                        if (position === INSIDE) {
                            if (grabbed.ID === overRef.current.ID) {
                                return;
                            }
                            await api(updateLabel(grabbed.ID, { ...grabbed, ParentID: overRef.current.ID }));
                            return call();
                        }

                        const { ParentID = ROOT_FOLDER } = overRef.current;
                        const LabelIDs = order(parents[ParentID])
                            .filter(({ ID }) => ID !== grabbed.ID)
                            .reduce((acc, folder) => {
                                const isOverred = folder.ID === overRef.current.ID;
                                if (isOverred && position === BEFORE) {
                                    acc.push(grabbed);
                                }
                                acc.push(folder);
                                if (isOverred && position === AFTER) {
                                    acc.push(grabbed);
                                }
                                return acc;
                            }, [])
                            .map(({ ID }) => ID);

                        await api(updateLabel(grabbed.ID, { ...grabbed, ParentID }));
                        await api(orderFolders({ LabelIDs, ParentID }));
                        return call();
                    };
                    return (
                        <TreeViewItem
                            onDragStart={() => {
                                setGrabbed(item);
                            }}
                            onDragEnd={() => {
                                clear();
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();

                                const { currentTarget, clientY } = event;
                                const { height, y } = currentTarget.getBoundingClientRect();
                                const quarter = height / 4;
                                const pointer = clientY - y;

                                overRef.current = item;

                                if (pointer < quarter) {
                                    setPosition(BEFORE);
                                } else if (pointer > quarter * 3) {
                                    setPosition(AFTER);
                                } else {
                                    setPosition(INSIDE);
                                }
                            }}
                            onDrop={() => withLoading(handleDrop())}
                            draggable={!isNarrow}
                            disabled={loading}
                            key={item.ID}
                            toggled
                            focussed={false}
                            title={item.Path}
                            content={
                                <div
                                    className={classnames([
                                        'flex flex-nowrap flex-align-items-center flex-justify-space-between w100 pt0-5 pb0-5 treeview-item relative',
                                        isOverred && position === BEFORE && 'treeview-item--move-top',
                                        isOverred && position === AFTER && 'treeview-item--move-bottom',
                                        isOverred && position === INSIDE && 'treeview-item--move-inside',
                                        grabbed && grabbed.ID === item.ID && 'treeview-item--self-grabbed',
                                    ])}
                                >
                                    <div className="treeview-item-name flex flex-nowrap flex-align-items-center flex-item-fluid">
                                        {isNarrow ? null : (
                                            <Icon
                                                name="text-justify"
                                                className="mr1 flex-item-noshrink cursor-row-resize"
                                            />
                                        )}
                                        <FolderIcon
                                            className="mr0-5 flex-item-noshrink"
                                            folder={{ ...item, subfolders: parents[item.ID] }}
                                        />
                                        <span className="text-ellipsis" title={item.Name}>
                                            {item.Name}
                                        </span>
                                    </div>
                                    <div className="treeview-toggle w10e no-mobile">
                                        <ToggleNotify label={item} />
                                    </div>
                                    <div className="treeview-actions w10e flex flex-column flex-align-items-end">
                                        <div className="mtauto mbauto">
                                            <ActionsLabel label={item} />
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            {buildTreeView(parents[item.ID], level + 1)}
                        </TreeViewItem>
                    );
                })}
            </TreeViewContainer>
        );
    };

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            <Header isNarrow={isNarrow} />
            {buildTreeView(rootFolders)}
        </>
    );
};

FolderTreeViewList.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            ID: PropTypes.string.isRequired,
            ParentID: PropTypes.string,
            Name: PropTypes.string.isRequired,
            Path: PropTypes.string.isRequired,
            Color: PropTypes.string.isRequired,
            Type: PropTypes.number.isRequired,
            Notify: PropTypes.number.isRequired,
            Order: PropTypes.number.isRequired,
            Expanded: PropTypes.number.isRequired,
            Sticky: PropTypes.number.isRequired,
        })
    ),
};

export default FolderTreeViewList;
