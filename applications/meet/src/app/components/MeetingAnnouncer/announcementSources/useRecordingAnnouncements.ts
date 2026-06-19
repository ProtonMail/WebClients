import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsLocalParticipantRecording,
    selectIsRecordingInProgress,
} from '@proton/meet/store/slices/recordingStatusSlice';

import { announcementMessages } from '../messages';
import { AnnouncementPriority } from '../types';
import { useAnnounce } from '../useAnnounce';

const getRecordingStartedMessage = (isLocalParticipantRecording: boolean) =>
    // Remote start adds consent context (its modal is silenced); local start was user-initiated.
    isLocalParticipantRecording
        ? announcementMessages.recordingStarted()
        : announcementMessages.recordingStartedWithConsent();

export const useRecordingAnnouncements = () => {
    const announce = useAnnounce();

    const isRecording = useMeetSelector(selectIsRecordingInProgress);
    const isLocalParticipantRecording = useMeetSelector(selectIsLocalParticipantRecording);

    // null until first run so an already-in-progress recording is not announced on mount.
    const previousRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (previousRef.current === null) {
            previousRef.current = isRecording;
            // Announce to users who join while a recording is already in progress.
            if (isRecording) {
                announce(announcementMessages.recordingAlreadyInProgress(), {
                    dedupeKey: 'recording-already-in-progress',
                    priority: AnnouncementPriority.High,
                });
            }
            return;
        }

        if (isRecording === previousRef.current) {
            return;
        }
        previousRef.current = isRecording;

        // Key by state so a quick stop → start within the de-dup window doesn't drop the second one.
        announce(
            isRecording
                ? getRecordingStartedMessage(isLocalParticipantRecording)
                : announcementMessages.recordingStopped(),
            {
                dedupeKey: `recording-${isRecording}`,
                priority: AnnouncementPriority.High,
            }
        );
    }, [isRecording, isLocalParticipantRecording, announce]);
};
