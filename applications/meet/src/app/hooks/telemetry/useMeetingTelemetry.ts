import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useFlag } from '@proton/unleash/useFlag';

import { ParticipantQualityTelemetryProcessor } from './ParticipantQualityTelemetryProcessor';

export const useMeetingTelemetry = () => {
    const meetQualityTelemetryEnabled = useFlag('MeetQualityTelemetry');
    const room = useRoomContext();

    useEffect(() => {
        if (!meetQualityTelemetryEnabled) {
            return;
        }

        const participantQualityTelemetryProcessor = new ParticipantQualityTelemetryProcessor(room);

        participantQualityTelemetryProcessor.listen();

        return () => {
            participantQualityTelemetryProcessor.stopListening();
        };
    }, [meetQualityTelemetryEnabled]);
};
