import React from 'react';
import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemButton,
    LabelModal,
    useModals,
    SidebarListItemContentIcon
} from 'react-components';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { LABEL_COLORS, LABEL_TYPE } from 'proton-shared/lib/constants';

import { Label } from 'proton-shared/lib/interfaces/Label';

const EmptyLabels = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        const newLabel: Pick<Label, 'Name' | 'Color' | 'Type'> = {
            Name: '',
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: LABEL_TYPE.MESSAGE_LABEL
        };
        createModal(<LabelModal label={newLabel} />);
    };

    return (
        <SidebarListItem>
            <SidebarListItemButton onClick={handleClick}>
                <SidebarListItemContent right={<SidebarListItemContentIcon name="plus" color="white" />}>
                    {c('Link').t`Add label`}
                </SidebarListItemContent>
            </SidebarListItemButton>
        </SidebarListItem>
    );
};

export default EmptyLabels;
