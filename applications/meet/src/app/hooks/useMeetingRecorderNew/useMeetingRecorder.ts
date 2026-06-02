import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import {
    addParticipantRecording,
    removeParticipantRecording,
    selectIsLocalParticipantRecording,
    setIsLocalRecording,
    startLocalRecordingTimer,
    stopLocalRecordingTimer,
} from '@proton/meet/store/slices/recordingStatusSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { useSortedPagedParticipants } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { RecordingStatus } from '../../types';
import { useIsLargerThanMd } from '../useIsLargerThanMd';
import { useIsNarrowHeight } from '../useIsNarrowHeight';
import { useStableCallback } from '../useStableCallback';
import { useHaveRecordingPermissions } from './hooks/useHaveRecordingPermissions';
import { useIsRecordingSupported } from './hooks/useIsRecordingSupported';
import { useRecordedTracks } from './hooks/useRecordedTracks';
import { useRecordingCodec } from './hooks/useRecordingCodec';
import { useRecordingScene } from './hooks/useRecordingScene';
import { useRecordingStatusPublish } from './hooks/useRecordingStatusPublish';
import { useTrackPublishedSubscriber } from './hooks/useTrackPublishedSubscriber';
import { RecordingSession } from './recordingSession/recordingSession';

export const useMeetingRecorder = () => {
    const hasRecordingPermissions = useHaveRecordingPermissions();
    const isRecordingSupported = useIsRecordingSupported();
    const recordingCodec = useRecordingCodec(hasRecordingPermissions && isRecordingSupported);

    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();
    const { createNotification } = useNotifications();

    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');
    const isLocalRecording = useMeetSelector(selectIsLocalParticipantRecording);

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTracks = useTracks([Track.Source.ScreenShare]);
    const audioTracks = useTracks([Track.Source.Microphone, Track.Source.ScreenShareAudio]);

    const pagedParticipants = useSortedPagedParticipants();
    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const recordedTracks = useRecordedTracks({ pagedParticipants, cameraTracks, screenShareTracks });
    const scene = useRecordingScene({
        recordedTracks,
        participantDecryptedNameMap,
        isLargerThanMd,
        isNarrowHeight,
    });

    const publishRecordingStatus = useRecordingStatusPublish(
        isLocalRecording ? RecordingStatus.Started : RecordingStatus.Stopped
    );

    const sessionRef = useRef<RecordingSession | null>(null);

    const markRecordingStopped = useCallback(() => {
        dispatch(stopLocalRecordingTimer());
        if (isMeetMultipleRecordingEnabled) {
            dispatch(removeParticipantRecording(room.localParticipant.identity));
        } else {
            dispatch(setIsLocalRecording(false));
        }
    }, [dispatch, isMeetMultipleRecordingEnabled, room]);

    const cleanupSession = useCallback(async () => {
        const session = sessionRef.current;
        if (!session) {
            return;
        }
        sessionRef.current = null;
        await session.cleanup();
        markRecordingStopped();
    }, [markRecordingStopped]);

    useEffect(() => {
        if (!isLocalRecording) {
            return;
        }
        sessionRef.current?.updateScene(scene);
    }, [scene, isLocalRecording]);

    useEffect(() => {
        if (!isLocalRecording) {
            return;
        }
        sessionRef.current?.updateRecordedTracks(recordedTracks);
    }, [recordedTracks, isLocalRecording]);

    useEffect(() => {
        if (!isLocalRecording) {
            return;
        }
        sessionRef.current?.updateAudioTracks(audioTracks);
    }, [audioTracks, isLocalRecording]);

    useTrackPublishedSubscriber({ enabled: isLocalRecording, room });

    const startRecording = useCallback(async () => {
        if (!recordingCodec) {
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder] codec detection has not resolved yet.');
            reportMeetError('MeetingRecording Error: codec detection not ready at startRecording');
            return;
        }

        try {
            const session = new RecordingSession({
                codec: recordingCodec,
                reportMeetError,
                onRuntimeError: () => {
                    void cleanupSession();
                },
            });
            sessionRef.current = session;

            await session.start({
                initialScene: scene,
                initialAudioTracks: audioTracks,
                initialRecordedTracks: recordedTracks,
            });

            if (isMeetMultipleRecordingEnabled) {
                dispatch(addParticipantRecording(room.localParticipant.identity));
            } else {
                dispatch(setIsLocalRecording(true));
            }
            dispatch(startLocalRecordingTimer());

            void publishRecordingStatus(RecordingStatus.Started);
        } catch (error) {
            reportMeetError('MeetingRecording Error: Failed to start recording', {
                context: {
                    error: error instanceof Error ? error.message : String(error),
                    name: error instanceof Error ? error.name : 'UnknownError',
                    recordingCodec,
                },
            });
            // eslint-disable-next-line no-console
            console.error('[MeetingRecorder] failed to start recording:', error);

            await cleanupSession();
            throw error;
        }
    }, [
        recordingCodec,
        scene,
        audioTracks,
        recordedTracks,
        reportMeetError,
        cleanupSession,
        isMeetMultipleRecordingEnabled,
        dispatch,
        room,
        publishRecordingStatus,
    ]);

    const stopRecording = useCallback(async () => {
        const session = sessionRef.current;
        if (!session || !isLocalRecording) {
            return null;
        }

        try {
            const artifact = await session.stop();
            void publishRecordingStatus(RecordingStatus.Stopped);
            markRecordingStopped();
            return artifact;
        } catch (error) {
            reportMeetError('MeetingRecording Error: Failed to stop recording', {
                context: {
                    error: error instanceof Error ? error.message : String(error),
                    name: error instanceof Error ? error.name : 'UnknownError',
                },
            });
            // eslint-disable-next-line no-console
            console.error('Failed to stop recording:', error);
            throw error;
        }
    }, [isLocalRecording, publishRecordingStatus, reportMeetError, markRecordingStopped]);

    const downloadRecording = useCallback(async () => {
        try {
            if (!isLocalRecording) {
                return;
            }

            const session = sessionRef.current;
            const codecForDownload = session?.getActiveCodec() ?? recordingCodec;

            const artifact = await stopRecording();

            if (!artifact || artifact.files.length === 0) {
                reportMeetError('MeetingRecording Error: Recording download failed: empty or missing blob', {
                    context: {
                        artifactExists: !!artifact,
                        fileCount: artifact?.files.length ?? 0,
                    },
                });
                throw new Error('Recording download failed: empty or missing blob');
            }

            const blob = new Blob(artifact.files, { type: artifact.mimeType });
            if (blob.size === 0) {
                reportMeetError('MeetingRecording Error: Recording download failed: empty or missing blob', {
                    context: { blobSize: 0 },
                });
                throw new Error('Recording download failed: empty or missing blob');
            }

            try {
                const url = URL.createObjectURL(blob);
                const extension = codecForDownload?.extension ?? 'webm';

                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-recording-${new Date().toISOString()}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (error) {
                reportMeetError('MeetingRecording Error: Failed to download recording', {
                    context: {
                        error: error instanceof Error ? error.message : String(error),
                        name: error instanceof Error ? error.name : 'UnknownError',
                    },
                });
                // eslint-disable-next-line no-console
                console.error('Failed to download recording:', error);
                throw error;
            }

            createNotification({
                text: c('Info').t`Recording saved`,
                type: 'success',
            });
        } catch {
            createNotification({
                text: c('Error').t`Failed to save recording`,
                type: 'error',
            });
        } finally {
            await cleanupSession();
        }
    }, [isLocalRecording, recordingCodec, stopRecording, reportMeetError, createNotification, cleanupSession]);

    // Cleanup the session and download the recording if the session is active
    const handleUnmount = useStableCallback(async () => {
        if (sessionRef.current?.isActive()) {
            void downloadRecording();
        } else {
            void cleanupSession();
        }
    });

    useEffect(() => {
        return () => {
            void handleUnmount();
        };
    }, [handleUnmount]);

    return {
        startRecording,
        downloadRecording,
    };
};
