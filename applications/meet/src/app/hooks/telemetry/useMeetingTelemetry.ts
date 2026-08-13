import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useFlag } from '@proton/unleash/useFlag';

import { ParticipantQualityTelemetryProcessor } from './ParticipantQualityTelemetryProcessor';

export const useMeetingTelemetry = (websocketUrl?: string) => {
    const meetQualityTelemetryEnabled = useFlag('MeetQualityTelemetry');
    const killSwitchEnabled = useFlag('MeetQualityTelemetryKillSwitch');
    const room = useRoomContext();

    useEffect(() => {
        if (!meetQualityTelemetryEnabled) {
            return;
        }

        const participantQualityTelemetryProcessor = new ParticipantQualityTelemetryProcessor(
            room,
            websocketUrl,
            killSwitchEnabled
        );

        participantQualityTelemetryProcessor.listen();

        return () => {
            participantQualityTelemetryProcessor.stopListening();
        };
    }, [meetQualityTelemetryEnabled, killSwitchEnabled, room, websocketUrl]);
};
