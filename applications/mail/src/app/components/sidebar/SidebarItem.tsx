import React, { DragEvent, ReactNode, useRef, memo } from 'react';
import {
    classnames,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    useEventManager,
    SidebarListItemLink,
    useLoading,
    useCache,
    HotkeyTuple,
    useHotkeys,
    useMailSettings,
} from 'react-components';
import { useHistory } from 'react-router-dom';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, DRAG_ELEMENT_KEY, DRAG_ELEMENT_ID_KEY } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { useDragOver } from '../../hooks/useDragOver';
import { ELEMENTS_CACHE_KEY } from '../../hooks/mailbox/useElementsCache';

const { ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

const noDrop: string[] = [ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    icon?: string;
    iconSize?: number;
    text: string;
    shortcutText?: string;
    content?: ReactNode;
    color?: string;
    unreadCount?: number;
    shortcutHandlers?: HotkeyTuple[];
    onFocus?: () => void;
    id?: string;
}

const SidebarItem = ({
    currentLabelID,
    labelID,
    icon,
    iconSize,
    text,
    shortcutText,
    content = text,
    color,
    isFolder,
    unreadCount,
    shortcutHandlers = [],
    onFocus = noop,
    id,
}: Props) => {
    const { call } = useEventManager();
    const cache = useCache();
    const history = useHistory();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const [refreshing, withRefreshing] = useLoading(false);

    const [dragOver, dragProps] = useDragOver(
        (event: DragEvent) =>
            event.dataTransfer.types.includes(DRAG_ELEMENT_KEY) &&
            currentLabelID !== labelID && // Never on current label
            !noDrop.includes(labelID), // Some destinations has no sense
        isFolder ? 'move' : 'link'
    );

    const applyLabel = useApplyLabels();
    const moveToFolder = useMoveToFolder();

    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        : labelID;
    const link = `/${humanID}`;

    const active = labelID === currentLabelID;
    const ariaCurrent = active ? 'page' : undefined;

    const handleClick = () => {
        if (history.location.pathname.endsWith(link) && !refreshing) {
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

    const elementRef = useRef<HTMLAnchorElement>(null);
    useHotkeys(elementRef, shortcutHandlers);

    return (
        <SidebarListItem className={classnames([dragOver && 'navigation-dragover'])}>
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
                title={shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text}
                ref={elementRef}
                data-test-id={id}
                data-shortcut-target={['navigation-link', id].filter(isTruthy).join(' ')}
                onFocus={onFocus}
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
