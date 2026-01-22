import type { Participant, TrackPublication } from 'livekit-client';
import {
    ConnectionState,
    type RemoteParticipant,
    type RemoteTrackPublication,
    type Room,
    RoomEvent,
    Track,
} from 'livekit-client';

interface PublicationItem {
    publication: RemoteTrackPublication;
    participant: RemoteParticipant;
}

export const sortAudioPublications = <T extends PublicationItem>(publications: T[]): T[] => {
    return publications.sort((a, b) => {
        if (!a.publication) {
            return 1;
        }

        if (!b.publication) {
            return -1;
        }

        if (a.publication.isMuted !== b.publication.isMuted) {
            return a.publication.isMuted ? 1 : -1;
        }

        return (b?.participant?.lastSpokeAt?.getTime() ?? 0) - (a?.participant?.lastSpokeAt?.getTime() ?? 0);
    });
};

export class AudioTrackSubscriptionManager {
    private microphoneCapacity: number;
    private room: Room;
    private subscribedMicrophoneTrackPublications: Map<string, PublicationItem> = new Map();
    private lastSortingResult: PublicationItem[] = [];
    private reconcileInterval: NodeJS.Timeout | null = null;

    constructor(capacity: number, room: Room) {
        this.microphoneCapacity = capacity;
        this.room = room;
    }

    addToCache(publication: RemoteTrackPublication, participant: RemoteParticipant) {
        this.subscribedMicrophoneTrackPublications.set(publication.trackSid, {
            participant,
            publication,
        });
    }

    handleCacheUpdate(pub: RemoteTrackPublication, participant: RemoteParticipant) {
        this.addToCache(pub, participant);

        const cache = this.subscribedMicrophoneTrackPublications;

        if (cache.size <= this.microphoneCapacity) {
            return;
        }

        const sortedCache = sortAudioPublications(Array.from(cache.values()));

        this.lastSortingResult = sortedCache;

        const tracksToUnsubscribe = sortedCache.slice(this.microphoneCapacity);

        tracksToUnsubscribe.forEach((track) => {
            track.publication.setSubscribed(false);
            cache.delete(track.publication.trackSid);
        });
    }

    getMicrophoneAudioPublications = () => {
        const microphoneAudioPublications: PublicationItem[] = [];

        for (const participant of this.room.remoteParticipants.values()) {
            if (participant.identity === this.room.localParticipant.identity) {
                continue;
            }

            for (const publication of participant.audioTrackPublications.values()) {
                const pub = publication as RemoteTrackPublication;

                if (pub.source === Track.Source.Microphone) {
                    microphoneAudioPublications.push({ publication: pub, participant });
                }
            }
        }

        return microphoneAudioPublications;
    };

    handleRoomConnected = () => {
        const microphoneAudioPublications: PublicationItem[] = [];

        for (const participant of this.room.remoteParticipants.values()) {
            if (participant.identity === this.room.localParticipant.identity) {
                continue;
            }

            for (const publication of participant.audioTrackPublications.values()) {
                const pub = publication as RemoteTrackPublication;

                if (pub.source === Track.Source.ScreenShareAudio) {
                    pub.setSubscribed(true);
                    pub.setEnabled(true);
                }

                if (pub.source === Track.Source.Microphone) {
                    microphoneAudioPublications.push({ publication: pub, participant });
                }
            }
        }

        const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

        const publicationsToRegister = sortedMicrophoneAudioPublications.slice(0, this.microphoneCapacity);

        for (const publication of publicationsToRegister) {
            if (!publication.publication.isSubscribed) {
                publication.publication.setSubscribed(true);
                publication.publication.setEnabled(true);
            }

            this.handleCacheUpdate(publication.publication, publication.participant);
        }
    };

    handleAudioTrackPublished = (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (pub.source === Track.Source.ScreenShareAudio) {
            pub.setSubscribed(true);
            pub.setEnabled(true);
            return;
        }

        if (pub.source === Track.Source.Microphone && !pub.isSubscribed) {
            // If the cache if already full, we prevent adding a new track that would be unsubscribed immediately
            if (this.subscribedMicrophoneTrackPublications.size >= this.microphoneCapacity) {
                const lastItemOfSortedResult = this.lastSortingResult.at(-1);

                if (lastItemOfSortedResult) {
                    const comparison = sortAudioPublications([
                        lastItemOfSortedResult,
                        { publication: pub, participant },
                    ]);

                    if (comparison[0].publication.trackSid === lastItemOfSortedResult.publication.trackSid) {
                        return;
                    }
                }
            }

            pub.setSubscribed(true);
            pub.setEnabled(true);

            this.handleCacheUpdate(pub, participant);
        }
    };

    handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (publication.source === Track.Source.Microphone && !publication.isSubscribed) {
            const pub = publication as RemoteTrackPublication;
            pub.setSubscribed(true);
            pub.setEnabled(true);

            this.handleCacheUpdate(pub, participant as RemoteParticipant);
        }
    };

    handleTrackUnpublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        if (publication.source === Track.Source.Microphone) {
            this.subscribedMicrophoneTrackPublications.delete(publication.trackSid);

            this.lastSortingResult = this.lastSortingResult.filter(
                (item) => item.publication.trackSid !== publication.trackSid
            );
        }
    };

    handleActiveSpeakerChanged = (participants: Participant[]) => {
        participants.forEach((participant) => {
            if (participant.identity === this.room.localParticipant.identity) {
                return;
            }

            const microphoneAudioPublication = [...participant.audioTrackPublications.values()].find(
                (item) => item.source === Track.Source.Microphone
            ) as RemoteTrackPublication;

            if (microphoneAudioPublication && !microphoneAudioPublication.isSubscribed) {
                microphoneAudioPublication.setSubscribed(true);
                microphoneAudioPublication.setEnabled(true);
                this.handleCacheUpdate(microphoneAudioPublication, participant as RemoteParticipant);
            }
        });
    };

    handleRoomDisconnected = () => {
        this.subscribedMicrophoneTrackPublications.clear();
    };

    listenToRoomEvents() {
        this.room.on(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.on(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.on(RoomEvent.Connected, this.handleRoomConnected);
        this.room.on(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
    }

    cleanupEventListeners() {
        this.room.off(RoomEvent.TrackPublished, this.handleAudioTrackPublished);
        this.room.off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted);
        this.room.off(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
        this.room.off(RoomEvent.Connected, this.handleRoomConnected);
        this.room.off(RoomEvent.Disconnected, this.handleRoomDisconnected);
        this.room.off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChanged);
    }

    reconcileAudioTracks = () => {
        if (this.room.state !== ConnectionState.Connected) {
            return;
        }

        const microphoneAudioPublications: PublicationItem[] = this.getMicrophoneAudioPublications();

        const sortedMicrophoneAudioPublications = sortAudioPublications(microphoneAudioPublications);

        // Get the top N publications. Ideally this is the same as the sorted cache.
        const microphoneAudioPublicationsToPotentiallySubscribe = sortedMicrophoneAudioPublications.slice(
            0,
            this.microphoneCapacity
        );

        // Get the publications that are not in the cache
        const publicationsToSubscribe = microphoneAudioPublicationsToPotentiallySubscribe.filter(
            (publication) => !this.subscribedMicrophoneTrackPublications.has(publication.publication.trackSid)
        );

        // Subscribe to the publications that were not in the cache
        // The handleCacheUpdate method will evict the oldest publication if the cache is full
        publicationsToSubscribe.forEach((publication) => {
            publication.publication.setSubscribed(true);
            publication.publication.setEnabled(true);

            this.handleCacheUpdate(publication.publication, publication.participant);
        });

        const currentCacheValues = Array.from(this.subscribedMicrophoneTrackPublications.values());

        // If any items from the cache lost subscription, we re-subscribe them
        currentCacheValues.forEach((item) => {
            if (!item.publication.isSubscribed) {
                item.publication.setSubscribed(true);
            }
        });
    };

    setupReconcileLoop = () => {
        this.reconcileInterval = setInterval(() => {
            this.reconcileAudioTracks();
        }, 5000);
    };

    cleanupReconcileLoop = () => {
        if (this.reconcileInterval) {
            clearInterval(this.reconcileInterval);
        }
    };

    setup = () => {
        this.listenToRoomEvents();
        this.setupReconcileLoop();
    };

    cleanup = () => {
        this.subscribedMicrophoneTrackPublications.clear();
        this.lastSortingResult = [];
        this.cleanupEventListeners();
        this.cleanupReconcileLoop();
    };
}
