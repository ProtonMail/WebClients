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
            tooltipClassName="security-shield-tooltip text-semibold p-4 "
            title={title}
            openDelay={0}
            closeDelay={0}
            originalPlacement="top"
        >
            <div className="security-shield flex items-center justify-center" style={{ display: 'inline-block' }}>
                <IcMeetShieldFull className="shield-full" size={3} />
                <IcMeetShield className="shield" size={3} />
            </div>
        </Tooltip>
    );
};
