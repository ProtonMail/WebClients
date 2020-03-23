import React, { useState, DragEvent, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { classnames, SidebarItem as CommonSidebarItem, SidebarItemContent, useEventManager } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, DRAG_ELEMENT_KEY } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { useDragOver } from '../../hooks/useDragOver';

const { ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

const noDrop: string[] = [ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT];

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    isConversation: boolean;
    icon?: string;
    text: string;
    content?: ReactNode;
    color?: string;
    count?: LabelCount;
}

const SidebarItem = ({
    currentLabelID,
    labelID,
    icon,
    text,
    content = text,
    color,
    isFolder,
    isConversation,
    count
}: Props) => {
    const { call } = useEventManager();

    const [refresh, setRefresh] = useState(false);

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
        if (link === location.pathname) {
            setRefresh(true);
            await call();
            setRefresh(false);
        }
    };

    const handleDrop = (event: DragEvent) => {
        dragProps.onDrop();
        const elementIDs = JSON.parse(event.dataTransfer.getData(DRAG_ELEMENT_KEY)) as string[];
        if (isFolder) {
            moveToFolder(!isConversation, elementIDs, labelID, text);
        } else {
            applyLabel(!isConversation, elementIDs, { [labelID]: true });
        }
    };

    return (
        <CommonSidebarItem className={classnames([dragOver && 'navigation__dragover'])}>
            <NavLink
                className={classnames(['navigation__link'])}
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
            >
                <SidebarItemContent
                    icon={icon}
                    iconColor={color}
                    text={content}
                    aside={<LocationAside count={count} active={active} refreshing={refresh} />}
                />
            </NavLink>
        </CommonSidebarItem>
    );
};

export default SidebarItem;
