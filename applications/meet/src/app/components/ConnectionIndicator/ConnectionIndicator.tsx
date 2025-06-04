import { ConnectionQuality } from 'livekit-client';

import { IcMeetConnectionIndicator } from '@proton/icons';

interface ConnectionIndicatorProps {
    connectionQuality: ConnectionQuality;
}

export const ConnectionIndicator = ({ connectionQuality }: ConnectionIndicatorProps) => {
    const connectionQualityColors = {
        [ConnectionQuality.Excellent]: 'color-success',
        [ConnectionQuality.Good]: 'color-warning',
        [ConnectionQuality.Poor]: 'color-danger',
        [ConnectionQuality.Lost]: 'color-weak',
        [ConnectionQuality.Unknown]: 'color-disabled',
    };

    const connectionQualityColor = connectionQualityColors[connectionQuality];
    return (
        <div
            className="bg-weak border-weak border-radius-full flex items-center justify-center rounded-full w-custom h-custom"
            style={{
                width: '2rem',
                height: '2rem',
            }}
        >
            <IcMeetConnectionIndicator className={connectionQualityColor} size={5} />
        </div>
    );
};
