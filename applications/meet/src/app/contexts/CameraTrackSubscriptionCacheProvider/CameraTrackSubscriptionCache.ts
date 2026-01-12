import type { RemoteTrackPublication, TrackPublication, VideoQuality } from 'livekit-client';
import { Track } from 'livekit-client';

import { TrackSubscriptionCache } from '../TrackSubscriptionCache/TrackSubscriptionCache';

export type RegisterCameraTrackFn = (publication: TrackPublication | undefined, participantIdentity?: string) => void;

/**
 * Camera-specific subscription policy.
 */
export interface CameraSubscriptionPolicy {
    disableVideos: boolean;
    participantsWithDisabledVideos: string[];
    participantQuality: VideoQuality | undefined;
}

export class CameraTrackSubscriptionCache extends TrackSubscriptionCache {
    private disableVideos = false;
    private participantsWithDisabledVideos: string[] = [];
    private participantQuality: VideoQuality | undefined;

    protected getTrackSource(): Track.Source {
        return Track.Source.Camera;
    }

    setPolicy(policy: CameraSubscriptionPolicy): void {
        this.disableVideos = policy.disableVideos;
        this.participantsWithDisabledVideos = policy.participantsWithDisabledVideos;
        this.participantQuality = policy.participantQuality;

        // Re-process all pinned tracks when policy changes
        for (const [trackSid, entry] of this.entriesByTrackSid.entries()) {
            if (entry.pinned && entry.participantIdentity) {
                this.enqueueSubscriptionWork(trackSid);
            }
        }
        void this.runSerialized(() => this.processSubscriptionQueue());
    }

    protected override shouldDisableTrack(participantIdentity: string): boolean {
        return this.disableVideos || this.participantsWithDisabledVideos.includes(participantIdentity);
    }

    protected override applyTrackQualitySettings(publication: RemoteTrackPublication, _participantIdentity: string) {
        if (this.participantQuality && publication.videoQuality !== this.participantQuality) {
            publication.setVideoQuality(this.participantQuality);
        }
    }

    protected override cleanupAdditionalState() {
        this.disableVideos = false;
        this.participantsWithDisabledVideos = [];
        this.participantQuality = undefined;
    }

    async resetQueueManagedVideoTrack(publication: RemoteTrackPublication) {
        return this.resetQueueManagedTrack(publication);
    }
}
