import type { Track, TrackPublication } from 'livekit-client';
import { RemoteTrackPublication } from 'livekit-client';

import { wait } from '@proton/shared/lib/helpers/promise';

export type RegisterTrackFn = (publication: TrackPublication | undefined, participantIdentity?: string) => void;

export interface TrackCacheEntry {
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

export abstract class TrackSubscriptionCache {
    private capacity: number = 0;
    private cacheOrderByRecencyTrackSids: string[] = [];
    protected entriesByTrackSid = new Map<string, TrackCacheEntry>();
    private pendingSubscriptionWorkTrackSids: string[] = [];

    // Serializes all operations that touch LiveKit publications (subscribe/enable/quality/reset).
    private operationChain: Promise<void> = Promise.resolve();

    // Per-track cooldown to prevent E2EE race conditions during rapid subscribe/unsubscribe cycles
    private lastUnsubscribeTime = new Map<string, number>();
    private readonly RESUBSCRIBE_COOLDOWN_MS = 500;

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    protected abstract getTrackSource(): Track.Source;

    protected shouldDisableTrack(_participantIdentity: string): boolean {
        return false;
    }

    protected applyTrackQualitySettings(_publication: RemoteTrackPublication, _participantIdentity: string): void {
        // Default implementation does nothing. Subclasses can override.
    }

    protected cleanupAdditionalState(): void {
        // Default implementation does nothing. Subclasses can override.
    }

    protected runSerialized(op: () => Promise<void> | void) {
        this.operationChain = this.operationChain.then(() => Promise.resolve(op())).catch(() => {});
        return this.operationChain;
    }

    register(publication: TrackPublication | undefined, participantIdentity?: string) {
        if (!(publication instanceof RemoteTrackPublication)) {
            return;
        }
        if (publication.source !== this.getTrackSource()) {
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
        this.maybeEvict();
    }

    unregister(publication: TrackPublication | undefined) {
        if (!(publication instanceof RemoteTrackPublication)) {
            return;
        }
        if (publication.source !== this.getTrackSource()) {
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
        if (publication.source !== this.getTrackSource()) {
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

    async resetQueueManagedTrack(publication: RemoteTrackPublication) {
        await this.runSerialized(async () => {
            const entry = this.entriesByTrackSid.get(publication.trackSid);
            const participantIdentity = entry?.participantIdentity;
            if (!entry || !participantIdentity) {
                return;
            }

            // Record the unsubscribe time to enforce cooldown on resubscribe
            this.lastUnsubscribeTime.set(publication.trackSid, Date.now());
            publication.setSubscribed(false);
            await wait(250);

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
        this.lastUnsubscribeTime.clear();

        this.cleanupAdditionalState();
    }

    private markMostRecentlyUsed(trackSid: string) {
        removeValueInPlace(this.cacheOrderByRecencyTrackSids, trackSid);
        this.cacheOrderByRecencyTrackSids.unshift(trackSid);
    }

    protected removeTrackSidEverywhere(trackSid: string) {
        const entry = this.entriesByTrackSid.get(trackSid);
        if (entry?.isEnqueued) {
            removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
        }
        this.entriesByTrackSid.delete(trackSid);
        removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
        removeValueInPlace(this.cacheOrderByRecencyTrackSids, trackSid);
        this.lastUnsubscribeTime.delete(trackSid);
    }

    protected enqueueSubscriptionWork(trackSid: string) {
        const entry = this.entriesByTrackSid.get(trackSid);
        if (!entry || entry.isEnqueued) {
            return;
        }
        entry.isEnqueued = true;
        this.pendingSubscriptionWorkTrackSids.push(trackSid);
    }

    protected async processSubscriptionQueue() {
        while (this.pendingSubscriptionWorkTrackSids.length) {
            const trackSid = this.pendingSubscriptionWorkTrackSids.shift()!;
            const entry = this.entriesByTrackSid.get(trackSid);
            if (!entry) {
                continue;
            }

            // Skip this entry if the same track appears later in the queue
            // This prevents processing stale requests when rapid state changes occur
            if (this.pendingSubscriptionWorkTrackSids.includes(trackSid)) {
                // Don't mark as not enqueued - it's still in the queue
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

            // Per-track cooldown: Wait only if THIS specific track was recently unsubscribed
            // This prevents E2EE race conditions without blocking other tracks
            const lastUnsubTime = this.lastUnsubscribeTime.get(trackSid);
            if (lastUnsubTime) {
                const elapsed = Date.now() - lastUnsubTime;
                if (elapsed < this.RESUBSCRIBE_COOLDOWN_MS) {
                    await wait(this.RESUBSCRIBE_COOLDOWN_MS - elapsed);
                }
                this.lastUnsubscribeTime.delete(trackSid);
            }

            const shouldBeDisabled = this.shouldDisableTrack(participantIdentity);

            try {
                if (!publication.isSubscribed) {
                    publication.setSubscribed(true);
                }

                const desiredEnabled = !shouldBeDisabled;
                if (publication.isEnabled !== desiredEnabled) {
                    publication.setEnabled(desiredEnabled);
                }

                if (!shouldBeDisabled) {
                    this.applyTrackQualitySettings(publication, participantIdentity);
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
        let numToEvict = this.entriesByTrackSid.size - this.capacity;

        // Iterate backwards (oldest to newest), collecting unpinned entries to evict
        for (let i = this.cacheOrderByRecencyTrackSids.length - 1; i >= 0 && numToEvict > 0; i--) {
            const trackSid = this.cacheOrderByRecencyTrackSids[i];
            const entry = this.entriesByTrackSid.get(trackSid);

            if (!entry) {
                // Clean up stale reference
                this.cacheOrderByRecencyTrackSids.splice(i, 1);
                continue;
            }

            if (entry.pinned) {
                // Skip pinned entries
                continue;
            }

            // Mark this entry for eviction
            this.cacheOrderByRecencyTrackSids.splice(i, 1);

            if (entry.isEnqueued) {
                removeValueInPlace(this.pendingSubscriptionWorkTrackSids, trackSid);
            }

            this.entriesByTrackSid.delete(trackSid);
            toEvict.push({ trackSid, publication: entry.publication });
            numToEvict--;
        }

        if (toEvict.length > 0) {
            void this.runSerialized(() => {
                for (const { trackSid, publication } of toEvict) {
                    try {
                        if (publication.isSubscribed) {
                            this.lastUnsubscribeTime.set(trackSid, Date.now());
                            publication.setEnabled(false);
                            publication.setSubscribed(false);
                        }
                    } catch {}
                }
            });
        }
    }
}
