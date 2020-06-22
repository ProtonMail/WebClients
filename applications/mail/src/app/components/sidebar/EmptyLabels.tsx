import React from 'react';
import { c } from 'ttag';

import { SidebarItem, SidebarItemContent, LabelModal, useModals } from 'react-components';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { LABEL_COLORS, LABEL_TYPE } from 'proton-shared/lib/constants';

import { Label } from 'proton-shared/lib/interfaces/Label';

const EmptyLabels = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        const newLabel: Partial<Label> = {
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: LABEL_TYPE.MESSAGE_LABEL
        };
        createModal(<LabelModal label={newLabel} />);
    };

    return (
        <SidebarItem>
            <button className="navigation__link w100 alignleft" onClick={handleClick}>
                <SidebarItemContent icon="plus" iconColor="white" text={c('Link').t`Add label`} />
            </button>
        </SidebarItem>
    );
};

export default EmptyLabels;
