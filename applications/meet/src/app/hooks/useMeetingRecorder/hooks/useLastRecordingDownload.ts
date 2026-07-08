import { useCallback } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRecording, selectRecordingStatus } from '@proton/meet/store/slices/recordingsSlice';

import { downloadOpfsRecording, isDownloadAborted } from '../recordingStorage/recordingFiles';

export const useLastRecordingDownload = () => {
    const { reportMeetError } = useMeetErrorReporting();
    const [userKeys = []] = useUserKeys();
    const { createNotification } = useNotifications();

    const recording = useMeetSelector(selectRecording);
    const recordingStatus = useMeetSelector(selectRecordingStatus);

    const hasRecordingToDownload = recordingStatus === 'ready';

    const downloadLastRecording = useCallback(async () => {
        if (!recording) {
            return;
        }

        try {
            const isFullRecording = await downloadOpfsRecording(
                recording,
                userKeys.map(({ privateKey }) => privateKey)
            );
            if (!isFullRecording) {
                createNotification({
                    type: 'info',
                    text: c('Info').t`Only a partial meeting recording was available.`,
                });
            }
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
    }, [recording, reportMeetError, userKeys, createNotification]);

    return { downloadLastRecording, hasRecordingToDownload };
};
