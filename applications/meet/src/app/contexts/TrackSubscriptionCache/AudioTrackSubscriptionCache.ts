import type { RemoteParticipant, RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

import { type TrackCacheEntry, TrackSubscriptionCache } from './TrackSubscriptionCache';

export interface AudioTrackCacheEntry extends TrackCacheEntry {
    participant?: RemoteParticipant;
}

export class AudioTrackSubscriptionCache extends TrackSubscriptionCache {
    private participantByTrackSid = new Map<string, RemoteParticipant>();

    protected getTrackSource(): Track.Source {
        return Track.Source.Microphone;
    }

    registerWithParticipant(publication: TrackPublication | undefined, participant: RemoteParticipant) {
        if (!publication?.trackSid) {
            return;
        }

        this.participantByTrackSid.set(publication.trackSid, participant);
        this.register(publication, participant.identity);
    }

    override unregister(publication: TrackPublication | undefined) {
        if (publication?.trackSid) {
            this.participantByTrackSid.delete(publication.trackSid);
        }
        super.unregister(publication);
    }

    override handleTrackUnpublished(publication: TrackPublication) {
        if (publication?.trackSid) {
            this.participantByTrackSid.delete(publication.trackSid);
        }
        super.handleTrackUnpublished(publication);
    }

    getParticipantForTrack(publication: RemoteTrackPublication): RemoteParticipant | undefined {
        return this.participantByTrackSid.get(publication.trackSid);
    }

    protected override cleanupAdditionalState() {
        this.participantByTrackSid.clear();
    }
}
