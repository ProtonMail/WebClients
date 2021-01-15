import React from 'react';
import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContentIcon,
    SidebarListItemContent,
    LabelModal,
    useModals,
} from 'react-components';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

interface Props {
    onFocus: () => void;
}

const EmptyFolders = ({ onFocus }: Props) => {
    const { createModal } = useModals();

    const handleClick = () => {
        const newLabel: Pick<Folder, 'Name' | 'Color' | 'ParentID' | 'Type'> = {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            ParentID: ROOT_FOLDER,
            Type: LABEL_TYPE.MESSAGE_FOLDER,
        };
        createModal(<LabelModal label={newLabel} />);
    };

    return (
        <SidebarListItem>
            <SidebarListItemButton onFocus={onFocus} data-shortcut-target="add-folder" onClick={handleClick}>
                <SidebarListItemContent right={<SidebarListItemContentIcon name="plus" color="white" />}>
                    {c('Link').t`Add folder`}
                </SidebarListItemContent>
            </SidebarListItemButton>
        </SidebarListItem>
    );
};

export default EmptyFolders;
