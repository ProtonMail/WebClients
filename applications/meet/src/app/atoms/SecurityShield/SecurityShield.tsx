import { Tooltip } from '@proton/atoms';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import type { IconSize } from '@proton/icons';
import { IcMeetShield, IcMeetShieldFull } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './SecurityShield.scss';

interface SecurityShieldProps {
    title: string;
    size?: IconSize;
    tooltipPlacement?: PopperPlacement;
    smallIcon?: boolean;
}

const smallIconStyle = {
    '--w-custom': '0.5rem',
    '--h-custom': '0.5rem',
};

export const SecurityShield = ({
    title,
    size = 3,
    tooltipPlacement = 'top',
    smallIcon = false,
}: SecurityShieldProps) => {
    return (
        <Tooltip
            className={clsx('flex items-center justify-center security-shield', smallIcon ? 'mr-1' : 'mr-2')}
            tooltipClassName="security-shield-tooltip text-semibold p-4 "
            title={title}
            openDelay={0}
            closeDelay={0}
            originalPlacement={tooltipPlacement}
        >
            <div
                className={clsx('security-shield flex items-center justify-center', smallIcon && 'w-custom h-custom')}
                style={{ display: 'inline-block', ...(smallIcon ? smallIconStyle : undefined) }}
            >
                <IcMeetShieldFull
                    className={clsx('shield-full', smallIcon && 'w-custom h-custom')}
                    size={size}
                    style={smallIcon ? smallIconStyle : undefined}
                />
                <IcMeetShield
                    className={clsx('shield', smallIcon && 'w-custom h-custom')}
                    size={size}
                    style={smallIcon ? smallIconStyle : undefined}
                />
            </div>
        </Tooltip>
    );
};
