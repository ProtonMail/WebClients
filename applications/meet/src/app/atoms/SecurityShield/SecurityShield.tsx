import { Tooltip } from '@proton/atoms';
import { IcMeetShield, IcMeetShieldFull } from '@proton/icons';

import './SecurityShield.scss';

interface SecurityShieldProps {
    title: string;
}

export const SecurityShield = ({ title }: SecurityShieldProps) => {
    return (
        <Tooltip
            className="mr-2 flex items-center justify-center security-shield"
            tooltipClassName="security-shield-tooltip text-semibold"
            title={title}
            openDelay={0}
            closeDelay={0}
            originalPlacement="top"
        >
            <div className="security-shield flex items-center justify-center" style={{ display: 'inline-block' }}>
                <IcMeetShieldFull className="shield-full color-primary mb-1" size={5} />
                <IcMeetShield className="shield color-primary mb-1" size={5} />
            </div>
        </Tooltip>
    );
};
