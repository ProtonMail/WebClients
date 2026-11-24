import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import usePreventLeave from '@proton/components/hooks/usePreventLeave';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    type OpfsRecording,
    getRecordingKey,
    recordingSaveEnded,
    recordingSaveStarted,
    selectSavingRecordingKeys,
} from '@proton/meet/store/slices/recordingsSlice';
import { getRecordingSizeBucket } from '@proton/meet/telemetry/buckets';
import { TelemetryMeetDashboardEvents, sendMeetDashboardEvent } from '@proton/meet/telemetry/meetTelemetry';

import { sendRecordingSaveStateToDesktopApp } from '../../../utils/sendRecordingSaveStateToDesktopApp';
import { isEncryptedRecordingFolder } from '../recordingStorage/getRecordingFolder';
import { downloadOpfsRecording } from '../recordingStorage/recordingFiles';

export const useRecordingDownload = () => {
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();
    const { preventLeave } = usePreventLeave();
    const dispatch = useMeetDispatch();
    const savingRecordingKeys = useMeetSelector(selectSavingRecordingKeys);

    const isRecordingSaving = useCallback(
        (recording: OpfsRecording) => savingRecordingKeys.includes(getRecordingKey(recording)),
        [savingRecordingKeys]
    );

    const saveRecording = useCallback(
        async (recording: OpfsRecording) => {
            const recordingKey = getRecordingKey(recording);
            dispatch(recordingSaveStarted(recordingKey));
            sendRecordingSaveStateToDesktopApp(true);

            try {
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
            } finally {
                dispatch(recordingSaveEnded(recordingKey));
                sendRecordingSaveStateToDesktopApp(false);
            }
        },
        [dispatch, getUserKeys, createNotification]
    );

    const downloadRecording = useCallback(
        (recording: OpfsRecording) => preventLeave(saveRecording(recording)),
        [preventLeave, saveRecording]
    );

    return { downloadRecording, isRecordingSaving };
};
