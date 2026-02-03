import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import { IcMeetShield } from '@proton/icons/icons/IcMeetShield';
import { IcMeetShieldFull } from '@proton/icons/icons/IcMeetShieldFull';
import type { IconSize } from '@proton/icons/types';
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
        <div className={clsx('flex items-center justify-center', smallIcon ? 'mr-1' : 'mr-2')}>
            <Tooltip
                tooltipClassName="meet-tooltip text-semibold p-4 "
                title={title}
                openDelay={0}
                closeDelay={0}
                originalPlacement={tooltipPlacement}
            >
                <div
                    className={clsx('security-shield flex items-center justify-center')}
                    style={{ display: 'inline-block' }}
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
        </div>
    );
};
