import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import type { OpfsRecording } from '@proton/meet/store/slices/recordingsSlice';
import { getRecordingSizeBucket } from '@proton/meet/telemetry/buckets';
import { TelemetryMeetDashboardEvents, sendMeetDashboardEvent } from '@proton/meet/telemetry/meetTelemetry';

import { isEncryptedRecordingFolder } from '../recordingStorage/getRecordingFolder';
import { downloadOpfsRecording } from '../recordingStorage/recordingFiles';

export const useRecordingDownload = () => {
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();

    const downloadRecording = useCallback(
        async (recording: OpfsRecording) => {
            const userKeys = isEncryptedRecordingFolder(recording.folder) ? await getUserKeys() : [];
            const isFullRecording = await downloadOpfsRecording(
                recording,
                userKeys.map(({ privateKey }) => privateKey)
            );
            sendMeetDashboardEvent(TelemetryMeetDashboardEvents.recording_downloaded, {
                sizeBucket: getRecordingSizeBucket(recording.size),
            });
            if (!isFullRecording) {
                createNotification({
                    type: 'info',
                    text: c('Error').t`Only part of the meeting was recorded.`,
                });
            }
        },
        [getUserKeys, createNotification]
    );

    return { downloadRecording };
};
