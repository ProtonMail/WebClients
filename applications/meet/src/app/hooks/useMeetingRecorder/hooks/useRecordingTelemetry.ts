import { useCallback, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectLocalRecordingTime } from '@proton/meet/store/slices/recordingStatusSlice';
import { selectLocalParticipantIdentity } from '@proton/meet/store/slices/sortedParticipantsSlice';

import { logRecordingStats } from '../../telemetry/meetingTelemetry';
import type { RecordingStats } from '../../telemetry/types';
import type { RecordingCodec } from '../codec/types';

export const useRecordingTelemetry = (recordingCodec: RecordingCodec | null) => {
    const room = useRoomContext();
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);

    const localRecordingTime = useMeetSelector(selectLocalRecordingTime);
    const currentRecordingDuration = useRef(localRecordingTime);

    // Avoid re-rendering the component when the recording duration changes.
    currentRecordingDuration.current = localRecordingTime;
    const sendTelemetryRecordingStats = useCallback(
        (size?: number) => {
            if (!size) {
                return;
            }

            const recordingStats: RecordingStats = {
                roomId: room.name,
                identity: localIdentity,
                recordingDuration: currentRecordingDuration.current ?? 0,
                recordingSize: size,
                recordingExtension: recordingCodec?.extension ?? '',
                recordingMimeType: recordingCodec?.mimeType ?? '',
            };

            logRecordingStats(recordingStats);
        },
        [localIdentity, recordingCodec, room.name]
    );

    return { sendTelemetryRecordingStats };
};
