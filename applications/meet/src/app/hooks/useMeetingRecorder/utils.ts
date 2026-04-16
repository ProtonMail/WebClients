import type { TrackReference } from '@livekit/components-react';
import type { LocalParticipant, RemoteParticipant, Track } from 'livekit-client';

import type { RecordingTrackInfo } from './types';

const mp4Codecs = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.4D001E,mp4a.40.2',
    'video/mp4;codecs=h264,aac',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
];

const webmCodecs = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
];

// Some codecs are detected as supported by MediaRecorder.isTypeSupported but when trying to use them, the browser throws an error.
// This function tests if the codec is actually supported by creating a MediaRecorder instance and checking if it throws an error.
const isCodecSupported = (codec: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!MediaRecorder.isTypeSupported(codec)) {
            resolve(false);
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const stream = canvas.captureStream(1);

        let timeout: NodeJS.Timeout | undefined;

        try {
            const mediaRecorder = new MediaRecorder(stream, { mimeType: codec });

            timeout = setTimeout(() => {
                mediaRecorder.stop();
                stream.getTracks().forEach((track) => track.stop());
                resolve(true);
            }, 2000);

            mediaRecorder.onerror = () => {
                stream.getTracks().forEach((track) => track.stop());
                clearTimeout(timeout);
                resolve(false);
            };

            mediaRecorder.ondataavailable = () => {
                mediaRecorder.stop();
                stream.getTracks().forEach((track) => track.stop());
                clearTimeout(timeout);
                resolve(true);
            };

            mediaRecorder.start(50);
        } catch (error: any) {
            stream.getTracks().forEach((track) => track.stop());
            clearTimeout(timeout);
            resolve(false);
        }
    });
};

export const getRecordingDetails = async () => {
    let selectedMimeType = 'video/webm';
    let selectedExtension = 'webm';

    for (const codec of mp4Codecs) {
        if (await isCodecSupported(codec)) {
            selectedMimeType = codec;
            selectedExtension = 'mp4';

            break;
        }
    }

    if (selectedExtension !== 'mp4') {
        for (const codec of webmCodecs) {
            if (await isCodecSupported(codec)) {
                selectedMimeType = codec;
                selectedExtension = 'webm';

                break;
            }
        }
    }

    return {
        mimeType: selectedMimeType,
        extension: selectedExtension,
    };
};

export const getTracksForRecording = (
    pagedParticipants: (RemoteParticipant | LocalParticipant)[],
    cameraTracks: TrackReference[],
    screenShareTracks: TrackReference[]
): RecordingTrackInfo[] => {
    const screenShareTrack = screenShareTracks?.[0];

    const participantTracksForRecording = pagedParticipants.map((participant, index) => {
        const cameraTrackReference = cameraTracks.find(
            (trackRef) => trackRef.participant?.identity === participant.identity
        );

        return {
            track: cameraTrackReference?.publication.track as Track,
            participant: participant,
            isScreenShare: false,
            participantIndex: index,
        };
    });

    const allTracks = screenShareTrack
        ? [
              {
                  track: screenShareTrack.publication.track as Track,
                  participant: screenShareTrack.participant,
                  isScreenShare: true,
                  participantIndex: 0,
              },
              ...participantTracksForRecording,
          ]
        : participantTracksForRecording;

    return allTracks;
};

export const supportsTrackProcessor = () => {
    return (
        typeof (window as any).MediaStreamTrackProcessor !== 'undefined' &&
        typeof (window as any).VideoFrame !== 'undefined'
    );
};

export const createMediaStreamTrackProcessor = (track: MediaStreamTrack) => {
    try {
        // In Safari, MediaStreamTrackProcessor is available in Worker context
        // @ts-expect-error - MediaStreamTrackProcessor is not yet in TypeScript types
        return new MediaStreamTrackProcessor({ track });
    } catch (error) {
        return null;
    }
};
