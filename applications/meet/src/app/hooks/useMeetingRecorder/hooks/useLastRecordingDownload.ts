import { useCallback } from 'react';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRecording, selectRecordingStatus } from '@proton/meet/store/slices/recordingsSlice';

import { downloadOpfsRecording, isDownloadAborted } from '../recordingStorage/recordingFiles';

export const useLastRecordingDownload = () => {
    const { reportMeetError } = useMeetErrorReporting();

    const recording = useMeetSelector(selectRecording);
    const recordingStatus = useMeetSelector(selectRecordingStatus);

    const hasRecordingToDownload = recordingStatus === 'ready';

    const downloadLastRecording = useCallback(async () => {
        if (!recording) {
            return;
        }

        try {
            await downloadOpfsRecording(recording);
        } catch (error) {
            if (!isDownloadAborted(error)) {
                reportMeetError('MeetingRecording Error: Failed to download recording', {
                    context: {
                        error: error instanceof Error ? error.message : String(error),
                        name: error instanceof Error ? error.name : 'UnknownError',
                    },
                });
            }

            throw error;
        }
    }, [recording, reportMeetError]);

    return { downloadLastRecording, hasRecordingToDownload };
};
