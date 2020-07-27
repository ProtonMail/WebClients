import React, { useState, DragEvent, ReactNode } from 'react';
import {
    classnames,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    useEventManager,
    SidebarListItemLink
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { wait } from 'proton-shared/lib/helpers/promise';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, DRAG_ELEMENT_KEY, DRAG_ELEMENT_ID_KEY } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { useDragOver } from '../../hooks/useDragOver';
import { useElementsCache } from '../../hooks/useElementsCache';

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
    count?: LabelCount;
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
    count
}: Props) => {
    const { call } = useEventManager();
    const [elementsCache] = useElementsCache();

    const [refreshing, setRefreshing] = useState(false);

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

    const handleClick = async () => {
        if (link === location.pathname && !refreshing) {
            setRefreshing(true);
            await Promise.all([call(), wait(1000)]);
            setRefreshing(false);
        }
    };

    const handleDrop = async (event: DragEvent) => {
        dragProps.onDrop();

        // Manual trigger of the dragend event on the drag element because native event is not reliable
        const dragElement = document.getElementById(event.dataTransfer.getData(DRAG_ELEMENT_ID_KEY));
        const dragendEvent = new Event('dragend') as any;
        dragendEvent.dataTransfer = event.dataTransfer;
        dragendEvent.dataTransfer.dropEffect = isFolder ? 'move' : 'link'; // Chrome is losing the original dropEffect
        dragElement?.dispatchEvent(dragendEvent);

        const elementIDs = JSON.parse(event.dataTransfer.getData(DRAG_ELEMENT_KEY)) as string[];
        const elements = elementIDs.map((elementID) => elementsCache.elements[elementID]);
        if (isFolder) {
            moveToFolder(elements, labelID, text, currentLabelID);
        } else {
            applyLabel(elements, { [labelID]: true });
        }
    };

    return (
        <SidebarListItem className={classnames([dragOver && 'navigation__dragover'])}>
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
                title={text}
            >
                <SidebarListItemContent
                    left={icon ? <SidebarListItemContentIcon name={icon} color={color} size={iconSize} /> : undefined}
                    right={<LocationAside count={count} active={active} refreshing={refreshing} />}
                >
                    {content}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SidebarItem;
