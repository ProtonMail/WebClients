import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ThemeColor } from '@proton/colors/types';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

interface Props {
    color: ThemeColor;
    /** Why the item needs attention: shown in a tooltip and read by screen readers */
    label?: string;
}

/** The "!" next to a sidebar item that needs attention */
export const SidebarNotificationIndicator = ({ color, label }: Props) => {
    const indicator = (
        <IcExclamationCircleFilled
            className={`color-${color} shrink-0`}
            size={4}
            alt={label || c('Info').t`Attention required`}
        />
    );

    if (!label) {
        return indicator;
    }

    // The label is already read through `alt`, so the tooltip doesn't also describe the icon
    return (
        <Tooltip title={label} originalPlacement="top" describeChild={false}>
            {indicator}
        </Tooltip>
    );
};
