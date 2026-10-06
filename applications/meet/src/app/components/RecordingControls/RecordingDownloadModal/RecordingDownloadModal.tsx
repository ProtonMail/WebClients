import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { IcArrowDownCircle } from '@proton/icons/icons/IcArrowDownCircle';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { clearRecording, selectRecording, selectRecordingStatus } from '@proton/meet/store/slices/recordingsSlice';
import { getRecordingDurationBucket } from '@proton/meet/telemetry/buckets';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { useLastRecordingDownload } from '../../../hooks/useMeetingRecorder/hooks/useLastRecordingDownload';
import { ConfirmationModal } from '../../ConfirmationModal/ConfirmationModal';
import { announcementMessages } from '../../MeetingAnnouncer/messages';
import { AnnouncementPriority } from '../../MeetingAnnouncer/types';
import { useAnnounce } from '../../MeetingAnnouncer/useAnnounce';
import { RecordingProcessingModal } from './RecordingProcessingModal';

export const RecordingDownloadModal = () => {
    const dispatch = useMeetDispatch();
    const status = useMeetSelector(selectRecordingStatus);
    const { downloadLastRecording } = useLastRecordingDownload();
    const announce = useAnnounce();
    const recording = useMeetSelector(selectRecording);
    const recordingReadyAtRef = useRef(0);

    useEffect(() => {
        recordingReadyAtRef.current = Date.now();
    }, [recording]);

    if (status === null) {
        return null;
    }

    const close = () => dispatch(clearRecording());

    if (status === 'error') {
        return (
            <ConfirmationModal
                title={c('Title').t`Couldn't prepare the recording`}
                primaryText={c('Action').t`Close`}
                onPrimaryAction={close}
                onClose={close}
            />
        );
    }

    if (status === 'processing') {
        return <RecordingProcessingModal />;
    }

    const sendPromptAnswered = (action: 'download' | 'dismiss') => {
        if (recording) {
            sendMeetActionsEvent(TelemetryMeetActionsEvents.recording_download_prompt_answered, {
                action,
                recordingDurationBucket: getRecordingDurationBucket(recordingReadyAtRef.current - recording.createdAt),
            });
        }
    };

    const dismiss = () => {
        sendPromptAnswered('dismiss');
        close();
    };

    const handleDownload = async () => {
        sendPromptAnswered('download');
        try {
            await downloadLastRecording();
            announce(announcementMessages.recordingSaved(), {
                dedupeKey: 'recording-saved',
                priority: AnnouncementPriority.High,
            });
            close();
        } catch {
            // Cancelled or failed, keep the modal open so the user can retry.
        }
    };

    return (
        <ConfirmationModal
            icon={<IcArrowDownCircle size={15} />}
            title={c('Title').t`Your recording is ready`}
            primaryText={c('Action').t`Download`}
            onPrimaryAction={handleDownload}
            secondaryText={c('Action').t`Close`}
            onSecondaryAction={dismiss}
            onClose={dismiss}
        />
    );
};
