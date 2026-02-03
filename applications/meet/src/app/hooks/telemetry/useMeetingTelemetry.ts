import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';

import useFlag from '@proton/unleash/useFlag';

import { ParticipantQualityTelemetryProcessor } from './ParticipantQualityTelemetryProcessor';

export const useMeetingTelemetry = () => {
    const meetQualityTelemetryEnabled = useFlag('MeetQualityTelemetry');
    const room = useRoomContext();

    const participantQualityTelemetryProcessor = useRef(new ParticipantQualityTelemetryProcessor(room));

    useEffect(() => {
        if (!meetQualityTelemetryEnabled) {
            return;
        }

        participantQualityTelemetryProcessor.current.listen();

        return () => {
            participantQualityTelemetryProcessor.current.stopListening();
        };
    }, []);
};
