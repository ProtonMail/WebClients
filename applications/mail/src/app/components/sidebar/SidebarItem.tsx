import React, { useState, DragEvent, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
    classnames,
    SidebarItem as CommonSidebarItem,
    SidebarItemContent,
    useFolders,
    useEventManager
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, DRAG_ELEMENT_KEY } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { useDragOver } from '../../hooks/useDragOver';

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    isConversation: boolean;
    icon?: string;
    text: ReactNode;
    color?: string;
    count?: LabelCount;
}

const SidebarItem = ({ currentLabelID, labelID, icon, text, color, isFolder, isConversation, count }: Props) => {
    const [folders = []] = useFolders();
    const { call } = useEventManager();

    const [refresh, setRefresh] = useState(false);

    const [dragOver, dragProps] = useDragOver(
        (event: DragEvent) =>
            labelID !== MAILBOX_LABEL_IDS.ALL_MAIL && event.dataTransfer.types.includes(DRAG_ELEMENT_KEY)
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
        const elementIDs = JSON.parse(event.dataTransfer.getData(DRAG_ELEMENT_KEY)) as string[];
        if (isFolder) {
            const folder = folders.find((folder) => folder.ID === labelID);
            moveToFolder(!isConversation, elementIDs, folder);
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
                onDrop={handleDrop}
                {...dragProps}
            >
                <SidebarItemContent
                    icon={icon}
                    iconColor={color}
                    text={text}
                    aside={<LocationAside count={count} active={active} refreshing={refresh} />}
                />
            </NavLink>
        </CommonSidebarItem>
    );
};

export default SidebarItem;
