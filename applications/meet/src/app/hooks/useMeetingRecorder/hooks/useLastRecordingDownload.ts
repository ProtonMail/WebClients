import { useCallback } from 'react';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRecording, selectRecordingStatus } from '@proton/meet/store/slices/recordingsSlice';

import { isDownloadAborted } from '../recordingStorage/recordingFiles';
import { useRecordingDownload } from './useRecordingDownload';

export const useLastRecordingDownload = () => {
    const { reportMeetError } = useMeetErrorReporting();
    const { downloadRecording } = useRecordingDownload();

    const recording = useMeetSelector(selectRecording);
    const recordingStatus = useMeetSelector(selectRecordingStatus);

    const hasRecordingToDownload = recordingStatus === 'ready';

    const downloadLastRecording = useCallback(async () => {
        if (!recording) {
            return;
        }

        try {
            await downloadRecording(recording);
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
    }, [recording, reportMeetError, downloadRecording]);

    return { downloadLastRecording, hasRecordingToDownload };
};
