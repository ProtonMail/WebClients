import React from 'react';
import { c } from 'ttag';

import { SidebarItem, SidebarItemContent, LabelModal, useModals } from 'react-components';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

const EmptyFolders = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        const newLabel: Partial<Folder> = {
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            ParentID: ROOT_FOLDER,
            Type: LABEL_TYPE.MESSAGE_FOLDER
        };
        createModal(<LabelModal label={newLabel} />);
    };

    return (
        <SidebarItem>
            <button className="navigation__link w100 alignleft" onClick={handleClick}>
                <SidebarItemContent icon="plus" iconColor="white" text={c('Link').t`Add folder`} />
            </button>
        </SidebarItem>
    );
};

export default EmptyFolders;
