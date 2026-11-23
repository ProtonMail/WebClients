import type { LocalParticipant, LocalTrackPublication, LocalVideoTrack } from 'livekit-client';
import { ParticipantEvent, Track } from 'livekit-client';

type CpuLimitation = 'limited' | 'not limited' | 'unreadable';

const readCpuLimitation = async (track: LocalVideoTrack): Promise<CpuLimitation> => {
    try {
        const stats = await track.getSenderStats();
        return stats.some((stat) => stat.qualityLimitationReason === 'cpu') ? 'limited' : 'not limited';
    } catch {
        return 'unreadable';
    }
};

// A CPU-limited screen share is left out: none of the drops lowers its encoding.
const getPublishedCameraTracks = (localParticipant: LocalParticipant) =>
    new Set(
        [...localParticipant.videoTrackPublications.values()].flatMap((publication) =>
            publication.videoTrack && publication.source === Track.Source.Camera ? [publication.videoTrack] : []
        )
    );

// LiveKit samples the sender stats every 2 s, emits only on the transition to constrained and keeps
// the flag private, so the signal reads the stats itself: they decide membership, the event only
// marks a track before the next read.
export const createLiveKitCpuConstraintSignal = (localParticipant: LocalParticipant) => {
    const constrainedTracks = new Set<LocalVideoTrack>();
    let isRefreshing = false;

    const markConstrained = (track: LocalVideoTrack, publication: LocalTrackPublication) => {
        if (publication.source === Track.Source.Camera) {
            constrainedTracks.add(track);
        }
    };
    localParticipant.on(ParticipantEvent.LocalTrackCpuConstrained, markConstrained);

    return {
        isCritical: () => constrainedTracks.size > 0,
        async refresh() {
            if (isRefreshing) {
                return;
            }
            isRefreshing = true;
            try {
                const publishedTracks = getPublishedCameraTracks(localParticipant);
                for (const track of constrainedTracks) {
                    if (!publishedTracks.has(track)) {
                        constrainedTracks.delete(track);
                    }
                }
                for (const track of publishedTracks) {
                    const cpuLimitation = await readCpuLimitation(track);
                    if (cpuLimitation === 'limited') {
                        constrainedTracks.add(track);
                    } else if (cpuLimitation === 'not limited') {
                        constrainedTracks.delete(track);
                    }
                }
            } finally {
                isRefreshing = false;
            }
        },
        stop() {
            localParticipant.off(ParticipantEvent.LocalTrackCpuConstrained, markConstrained);
            constrainedTracks.clear();
        },
    };
};
