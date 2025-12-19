import type { TrackPublication, VideoQuality } from 'livekit-client';
import { RemoteTrackPublication, Track } from 'livekit-client';

import { wait } from '@proton/shared/lib/helpers/promise';

export type RegisterCameraTrackFn = (publication: TrackPublication | undefined, participantIdentity?: string) => void;

interface CacheEntry {
    publication: RemoteTrackPublication;
    pinned: boolean;
    participantIdentity?: string;
    isEnqueued: boolean;
}

const removeValueInPlace = (arr: string[], value: string) => {
    const idx = arr.indexOf(value);
    if (idx !== -1) {
        arr.splice(idx, 1);
    }
};

export class CameraTrackSubscriptionCache {
    private capacity: number = 0;
    private cacheOrderByRecencyTrackSids: string[] = [];
    private entriesByTrackSid = new Map<string, CacheEntry>();
    private pendingSubscriptionWorkTrackSids: string[] = [];

    // Serializes all operations that touch LiveKit publications (subscribe/enable/quality/reset).
    private operationChain: Promise<void> = Promise.resolve();

    private disableVideos = false;
    private participantsWithDisabledVideos: string[] = [];
    private participantQuality: VideoQuality | undefined;

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    private runSerialized(op: () => Promise<void> | void) {
        this.operationChain = this.operationChain.then(() => Promise.resolve(op())).catch(() => {});
        return this.operationChain;
    }

    setPolicy({
        disableVideos,
        participantsWithDisabledVideos,
        participantQuality,
    }: {
        disableVideos: boolean;
        participantsWithDisabledVideos: string[];
        participantQuality: VideoQuality | undefined;
    }) {
        this.disableVideos = disableVideos;
        this.participantsWithDisabledVideos = participantsWithDisabledVideos;
        this.participantQuality = participantQuality;

        for (const [trackSid, entry] of this.entriesByTrackSid.entries()) {
            if (entry.pinned && entry.participantIdentity) {
                this.enqueueSubscriptionWork(trackSid);
            }
        }
        void this.runSerialized(() => this.processSubscriptionQueue());
    }

    register(publication: TrackPublication | undefined, participantIdentity?: string) {
        if (!(publication instanceof RemoteTrackPublication)) {
            return;
        }
        if (publication.source !== Track.Source.Camera) {
            return;
        }

        const trackSid = publication.trackSid;
        if (!trackSid) {
            return;
        }

        const existing = this.entriesByTrackSid.get(trackSid);
        if (existing) {
            existing.publication = publication;
            existing.pinned = true;
            if (participantIdentity) {
                existing.participantIdentity = participantIdentity;
            }
        } else {
            this.entriesByTrackSid.set(trackSid, {
                publication,
                pinned: true,
                participantIdentity,
                isEnqueued: false,
            });
        }

        if (participantIdentity) {
            this.enqueueSubscriptionWork(trackSid);
            void this.runSerialized(() => this.processSubscriptionQueue());
        }

        this.markMostRecentlyUsed(trackSid);
    }

    unregister(publication: TrackPublication | undefined) {
        if (!(publication instanceof RemoteTrackPublication)) {
            return;
        }
        if (publication.source !== Track.Source.Camera) {
            return;
        }

        const trackSid = publication.trackSid;
        if (!trackSid) {
            return;
        }

        const entry = this.entriesByTrackSid.get(trackSid);
        if (entry) {
            entry.pinned = false;
            entry.participantIdentity = undefined;
            if (entry.isEnqueued) {
                entry.isEnqueued = false;
                removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
            }
        }

        this.markMostRecentlyUsed(trackSid);

        if (publication.isSubscribed) {
            void this.runSerialized(() => {
                try {
                    publication.setEnabled(false);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error disabling publication', error);
                }
            });
        }

        this.maybeEvict();
    }

    handleTrackUnpublished(publication: TrackPublication) {
        if (!(publication instanceof RemoteTrackPublication)) {
            return;
        }
        if (publication.source !== Track.Source.Camera) {
            return;
        }
        this.removeTrackSidEverywhere(publication.trackSid);
    }

    getQueueManagedTracksToMonitor(): RemoteTrackPublication[] {
        const tracks: RemoteTrackPublication[] = [];
        for (const entry of this.entriesByTrackSid.values()) {
            const pub = entry.publication;
            if (!entry.participantIdentity) {
                continue;
            }
            if (pub.isSubscribed && pub.isEnabled && !!pub.track && !pub.isMuted) {
                tracks.push(pub);
            }
        }
        return tracks;
    }

    async resetQueueManagedVideoTrack(publication: RemoteTrackPublication) {
        await this.runSerialized(async () => {
            const entry = this.entriesByTrackSid.get(publication.trackSid);
            const participantIdentity = entry?.participantIdentity;
            if (!entry || !participantIdentity) {
                return;
            }

            publication.setEnabled(false);
            await wait(100);
            publication.setSubscribed(false);
            await wait(100);

            this.enqueueSubscriptionWork(publication.trackSid);
            await this.processSubscriptionQueue();
        });
    }

    destroy() {
        for (const entry of this.entriesByTrackSid.values()) {
            try {
                entry.publication.setEnabled(false);
                entry.publication.setSubscribed(false);
            } catch {
                // Ignore errors during cleanup
            }
        }

        this.entriesByTrackSid.clear();
        this.cacheOrderByRecencyTrackSids = [];
        this.pendingSubscriptionWorkTrackSids = [];

        this.disableVideos = false;
        this.participantsWithDisabledVideos = [];
        this.participantQuality = undefined;
    }

    private markMostRecentlyUsed(trackSid: string) {
        removeValueInPlace(this.cacheOrderByRecencyTrackSids, trackSid);
        this.cacheOrderByRecencyTrackSids.unshift(trackSid);
    }

    private removeTrackSidEverywhere(trackSid: string) {
        const entry = this.entriesByTrackSid.get(trackSid);
        if (entry?.isEnqueued) {
            removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
        }
        this.entriesByTrackSid.delete(trackSid);
        removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
        removeValueInPlace(this.cacheOrderByRecencyTrackSids, trackSid);
    }

    private enqueueSubscriptionWork(trackSid: string) {
        const entry = this.entriesByTrackSid.get(trackSid);
        if (!entry || entry.isEnqueued) {
            return;
        }
        entry.isEnqueued = true;
        this.pendingSubscriptionWorkTrackSids.push(trackSid);
    }

    private async processSubscriptionQueue() {
        while (this.pendingSubscriptionWorkTrackSids.length) {
            const trackSid = this.pendingSubscriptionWorkTrackSids.shift()!;
            const entry = this.entriesByTrackSid.get(trackSid);
            if (!entry) {
                continue;
            }
            entry.isEnqueued = false;

            const { publication, participantIdentity } = entry;
            if (!participantIdentity) {
                continue;
            }

            // Validate publication identity. Note: `publication.track` is often undefined until we subscribe,
            // so we must not evict entries just because the track isn't attached yet.
            if (!publication.trackSid || publication.trackSid !== trackSid) {
                this.removeTrackSidEverywhere(trackSid);
                continue;
            }

            const shouldBeDisabled =
                this.disableVideos || this.participantsWithDisabledVideos.includes(participantIdentity);

            try {
                if (!publication.isSubscribed) {
                    publication.setSubscribed(true);
                    await wait(0);
                }

                const desiredEnabled = !shouldBeDisabled;
                if (publication.isEnabled !== desiredEnabled) {
                    publication.setEnabled(desiredEnabled);
                }

                if (
                    !shouldBeDisabled &&
                    this.participantQuality &&
                    publication.videoQuality !== this.participantQuality
                ) {
                    publication.setVideoQuality(this.participantQuality);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }
    }

    private maybeEvict() {
        if (this.entriesByTrackSid.size <= this.capacity) {
            return;
        }

        const toEvict: { trackSid: string; publication: RemoteTrackPublication }[] = [];
        let index = this.cacheOrderByRecencyTrackSids.length - 1;

        while (index >= 0 && this.entriesByTrackSid.size > this.capacity) {
            const trackSid = this.cacheOrderByRecencyTrackSids[index];
            const entry = this.entriesByTrackSid.get(trackSid);

            if (!entry) {
                this.cacheOrderByRecencyTrackSids.splice(index, 1);
                continue;
            }

            if (entry.pinned) {
                index = index - 1;
                continue;
            }

            this.cacheOrderByRecencyTrackSids.splice(index, 1);

            if (entry.isEnqueued) {
                removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
            }

            this.entriesByTrackSid.delete(trackSid);
            toEvict.push({ trackSid, publication: entry.publication });

            index = index - 1;
        }

        if (toEvict.length > 0) {
            void this.runSerialized(() => {
                for (const { publication } of toEvict) {
                    try {
                        if (publication.isSubscribed) {
                            publication.setEnabled(false);
                            publication.setSubscribed(false);
                        }
                    } catch {}
                }
            });
        }
    }
}
