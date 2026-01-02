import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionQuality, type Participant } from 'livekit-client';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcMeetConnectionIndicator } from '@proton/icons/icons/IcMeetConnectionIndicator';
import clsx from '@proton/utils/clsx';

import './NetworkQualityIndicator.scss';

interface NetworkQualityIndicatorProps {
    size: number;
    participant: Participant;
    indicatorSize?: number;
}

const getPathVisibilityClasses = (connectionQuality: ConnectionQuality | undefined) => {
    switch (connectionQuality) {
        case ConnectionQuality.Good:
            return 'hide-connection-path-3';
        case ConnectionQuality.Poor || ConnectionQuality.Lost:
            return 'hide-connection-path-2 hide-connection-path-3';
        default:
            return '';
    }
};

const getLabel = (connectionQuality: ConnectionQuality | undefined) => {
    switch (connectionQuality) {
        case ConnectionQuality.Excellent:
            // Translators: Excellent network/internet connection performance
            return c('Tooltip').t`Excellent connection`;
        case ConnectionQuality.Good:
            // Translators: Good network/internet connection performance
            return c('Tooltip').t`Good connection`;
        case ConnectionQuality.Poor:
            // Translators: Poor network/internet connection performance
            return c('Tooltip').t`Poor connection`;
        case ConnectionQuality.Lost:
            // Translators: Lost network/internet connection
            return c('Tooltip').t`Lost connection`;
        default:
            // Translators: Unknown network/internet connection status
            return c('Tooltip').t`Unknown connection status`;
    }
};

export const NetworkQualityIndicator = ({ size, participant, indicatorSize = 24 }: NetworkQualityIndicatorProps) => {
    const room = useRoomContext();
    const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | undefined>(
        participant.connectionQuality
    );

    useEffect(() => {
        setConnectionQuality(participant.connectionQuality);

        const handleConnectionQualityChanged = (quality: ConnectionQuality, changedParticipant: Participant) => {
            if (changedParticipant.identity === participant.identity) {
                setConnectionQuality(quality);
            }
        };

        room.on('connectionQualityChanged', handleConnectionQualityChanged);

        return () => {
            room.off('connectionQualityChanged', handleConnectionQualityChanged);
        };
    }, [participant.identity, room]);

    const pathVisibilityClasses = getPathVisibilityClasses(connectionQuality);
    const isDanger = connectionQuality === ConnectionQuality.Poor || connectionQuality === ConnectionQuality.Lost;

    if (!isDanger) {
        // Only display icon when connection quality is poor or lost
        return null;
    }

    return (
        <Tooltip title={getLabel(connectionQuality)} tooltipClassName="network-quality-tooltip bg-strong color-norm">
            <div
                className={clsx(
                    'user-select-none flex items-center justify-center w-custom h-custom rounded-full',
                    pathVisibilityClasses,
                    isDanger ? 'connection-lost-background-color-danger' : 'bg-weak'
                )}
                style={{ width: size, height: size, opacity: 0.8 }}
            >
                <IcMeetConnectionIndicator width={indicatorSize} height={indicatorSize} />
            </div>
        </Tooltip>
    );
};
