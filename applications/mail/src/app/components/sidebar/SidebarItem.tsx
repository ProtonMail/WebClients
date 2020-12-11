import React, { DragEvent, ReactNode, memo } from 'react';
import {
    classnames,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    useEventManager,
    SidebarListItemLink,
    useLoading,
    useCache,
    useMailSettings,
} from 'react-components';
import { useLocation } from 'react-router-dom';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, DRAG_ELEMENT_KEY, DRAG_ELEMENT_ID_KEY } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { useDragOver } from '../../hooks/useDragOver';
import { ELEMENTS_CACHE_KEY } from '../../hooks/useElementsCache';

const { ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

const noDrop: string[] = [ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    icon?: string;
    iconSize?: number;
    text: string;
    content?: ReactNode;
    color?: string;
    unreadCount?: number;
}

const SidebarItem = ({
    currentLabelID,
    labelID,
    icon,
    iconSize,
    text,
    content = text,
    color,
    isFolder,
    unreadCount,
}: Props) => {
    const { call } = useEventManager();
    const cache = useCache();
    const location = useLocation();
    const [mailSettings] = useMailSettings();
    const [refreshing, withRefreshing] = useLoading(false);
    const applyLabel = useApplyLabels();
    const moveToFolder = useMoveToFolder();
    const [dragOver, dragProps] = useDragOver(
        (event: DragEvent) =>
            event.dataTransfer.types.includes(DRAG_ELEMENT_KEY) &&
            currentLabelID !== labelID && // Never on current label
            !noDrop.includes(labelID), // Some destinations has no sense
        isFolder ? 'move' : 'link'
    );

    const isColumnLayout = mailSettings?.ViewLayout === VIEW_LAYOUT.COLUMN;
    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        : labelID;
    const link = `/${humanID}`;
    const active = labelID === currentLabelID;
    const ariaCurrent = active ? 'page' : undefined;

    const getTo = () => {
        if (active && isColumnLayout) {
            // Keep element open if present
            const [, context] = location.pathname.split(link);
            if (context) {
                return `${link}${context}`;
            }
        }
        return link;
    };

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const ended = location.pathname.endsWith(link);
        const params = new URLSearchParams(location.search);
        const page = params.get('page') || 1;
        const onFirstPage = page === 1;

        // Don't loose conversation focus with column layout
        if (isColumnLayout && active && onFirstPage) {
            event.preventDefault();
        }

        // Refresh models depending on current location and view layout
        if (!refreshing && ((active && isColumnLayout) || (ended && !isColumnLayout))) {
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }
    };

    const handleDrop = async (event: DragEvent) => {
        // Avoid useElementsCache for perf issues
        const elementsCache = cache.get(ELEMENTS_CACHE_KEY);

        dragProps.onDrop(event);

        // Manual trigger of the dragend event on the drag element because native event is not reliable
        const dragElement = document.getElementById(event.dataTransfer.getData(DRAG_ELEMENT_ID_KEY));
        const dragendEvent = new Event('dragend') as any;
        dragendEvent.dataTransfer = event.dataTransfer;
        dragendEvent.dataTransfer.dropEffect = isFolder ? 'move' : 'link'; // Chrome is losing the original dropEffect
        dragElement?.dispatchEvent(dragendEvent);

        const elementIDs = JSON.parse(event.dataTransfer.getData(DRAG_ELEMENT_KEY)) as string[];
        const elements = elementIDs.map((elementID) => elementsCache.elements[elementID]);
        if (isFolder) {
            void moveToFolder(elements, labelID, text, currentLabelID);
        } else {
            void applyLabel(elements, { [labelID]: true });
        }
    };

    return (
        <SidebarListItem className={classnames([dragOver && 'navigation__dragover'])}>
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={getTo()}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
                title={text}
            >
                <SidebarListItemContent
                    left={icon ? <SidebarListItemContentIcon name={icon} color={color} size={iconSize} /> : undefined}
                    right={<LocationAside unreadCount={unreadCount} active={active} refreshing={refreshing} />}
                >
                    {content}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
