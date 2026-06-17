import { useMemo } from 'react';

import { Track } from 'livekit-client';

import { calculateGridLayout } from '../../../utils/calculateGridLayout';
import type { ParticipantInfo, RecordingTrackInfo, SceneState } from '../videoMixer/types';

interface UseRecordingSceneOptions {
    recordedTracks: RecordingTrackInfo[];
    participantDecryptedNameMap: Record<string, string>;
    isLargerThanMd: boolean;
    isNarrowHeight: boolean;
}

const buildParticipantInfo = (
    track: RecordingTrackInfo,
    participantDecryptedNameMap: Record<string, string>
): ParticipantInfo => {
    const audioPublication = Array.from(track.participant.trackPublications.values()).find(
        (pub) => pub.kind === Track.Kind.Audio && pub.track
    );
    const hasActiveAudio = audioPublication ? !audioPublication.isMuted : false;

    return {
        identity: track.participant?.identity || '',
        name: participantDecryptedNameMap[track.participant?.identity || ''] || 'Unknown',
        participantIndex: track.participantIndex,
        isScreenShare: track.isScreenShare,
        hasVideo: Boolean(track.track && !track.track.isMuted),
        hasActiveAudio,
    };
};

export const useRecordingScene = ({
    recordedTracks,
    participantDecryptedNameMap,
    isLargerThanMd,
    isNarrowHeight,
}: UseRecordingSceneOptions): SceneState => {
    return useMemo(() => {
        const participants = recordedTracks.map((track) => buildParticipantInfo(track, participantDecryptedNameMap));
        const isSmallScreen = !isLargerThanMd || isNarrowHeight;

        return {
            participants,
            isLargerThanMd,
            isNarrowHeight,
            gridLayout: calculateGridLayout(participants.length, isSmallScreen),
        };
    }, [recordedTracks, participantDecryptedNameMap, isLargerThanMd, isNarrowHeight]);
};
