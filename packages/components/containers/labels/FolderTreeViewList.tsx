import type { DragEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { orderFolders, updateLabel } from '@proton/shared/lib/api/labels';
import { ROOT_FOLDER } from '@proton/shared/lib/constants';
import { getParents, order } from '@proton/shared/lib/helpers/folder';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import clsx from '@proton/utils/clsx';

import { Info, TreeViewContainer, TreeViewItem } from '../../components';
import { useActiveBreakpoint, useApi, useEventManager } from '../../hooks';
import ActionsLabel from './ActionsLabel';
import FolderIcon from './FolderIcon';
import ToggleNotify from './ToggleNotify';

const INSIDE = 'inside';
const AFTER = 'after';
const BEFORE = 'before';

interface HeaderProps {
    isSmallViewport: boolean;
}

const Header = ({ isSmallViewport }: HeaderProps) => {
    return (
        <div className="flex flex-nowrap w-full border-bottom pb-2 treeview-header">
            <span className="text-bold flex-1">
                {isSmallViewport ? null : <Icon name="arrows-cross" className="mr-4" />}
                {c('Header').t`Folders`}
            </span>
            <span className="w-custom hidden md:flex items-center gap-2" style={{ '--w-custom': '10em' }}>
                <span className="text-bold">{c('Header').t`Notifications`}</span>
                <Info title={c('Tooltip').t`Enable/disable desktop and mobile notifications`} />
            </span>
            <span className="text-bold w-custom text-right" style={{ '--w-custom': '10em' }}>{c('Header')
                .t`Actions`}</span>
        </div>
    );
};

interface Props {
    items: Folder[];
}

const FolderTreeViewList = ({ items = [] }: Props) => {
    const api = useApi();
    const { viewportWidth } = useActiveBreakpoint();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [grabbed, setGrabbed] = useState<Folder>();
    const [position, setPosition] = useState<string>();
    const overRef = useRef<Folder>();
    const timeoutRef = useRef<NodeJS.Timeout>();
    const parents = getParents(items);
    const rootFolders = items.filter(({ ParentID = ROOT_FOLDER }) => ParentID === ROOT_FOLDER);

    const clear = () => {
        // Delay clear to execute onDrop first
        timeoutRef.current = setTimeout(() => {
            setGrabbed(undefined);
            setPosition(undefined);
            overRef.current = undefined;
        }, 200);
    };

    const buildTreeView = (items: Folder[] = [], level = 0) => {
        return (
            <TreeViewContainer>
                {order(items).map((item) => {
                    const isOverred = item.ID === overRef.current?.ID;

                    const handleDrop = async () => {
                        if (!grabbed) {
                            return;
                        }

                        if (position === INSIDE) {
                            if (grabbed.ID === overRef.current?.ID) {
                                return;
                            }
                            await api(updateLabel(grabbed.ID, { ...grabbed, ParentID: overRef.current?.ID }));
                            return call();
                        }

                        const { ParentID = ROOT_FOLDER } = overRef.current as Folder;

                        const LabelIDs = order(parents[ParentID])
                            .filter(({ ID }) => ID !== grabbed?.ID)
                            .reduce<Folder[]>((acc, folder) => {
                                const isOverred = folder.ID === overRef.current?.ID;
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
                            onDragOver={(event: DragEvent) => {
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
                            draggable={!viewportWidth['<=small']}
                            disabled={loading}
                            key={item.ID}
                            toggled
                            focussed={false}
                            title={item.Path}
                            content={
                                <div
                                    className={clsx([
                                        'flex flex-nowrap items-center justify-space-between w-full py-2 treeview-item relative',
                                        isOverred && position === BEFORE && 'treeview-item--move-top',
                                        isOverred && position === AFTER && 'treeview-item--move-bottom',
                                        isOverred && position === INSIDE && 'treeview-item--move-inside',
                                        grabbed && grabbed.ID === item.ID && 'treeview-item--self-grabbed',
                                    ])}
                                >
                                    <div className="treeview-item-name flex flex-nowrap items-center flex-1">
                                        {viewportWidth['<=small'] ? null : (
                                            <Icon name="dots" className="mr-4 shrink-0 cursor-grab color-hint" />
                                        )}
                                        <FolderIcon
                                            className="mr-2 shrink-0"
                                            folder={{ ...item, subfolders: parents[item.ID] }}
                                        />
                                        <span className="text-ellipsis" title={item.Name}>
                                            {item.Name}
                                        </span>
                                    </div>
                                    <div
                                        className="w-custom md:w-custom hidden md:inline-flex"
                                        style={{ '--w-custom': '6.25rem', '--md-w-custom': '10em' }}
                                    >
                                        <ToggleNotify label={item} />
                                    </div>
                                    <div
                                        className="w-custom md:w-custom flex flex-column items-end treeview-actions"
                                        style={{ '--w-custom': '6.25rem', '--md-w-custom': '10em' }}
                                    >
                                        <div className="my-auto">
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
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <Header isSmallViewport={viewportWidth['<=small']} />
            {buildTreeView(rootFolders)}
        </>
    );
};

export default FolderTreeViewList;
