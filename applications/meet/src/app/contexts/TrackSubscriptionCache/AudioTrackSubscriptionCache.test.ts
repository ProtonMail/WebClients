import { waitFor } from '@testing-library/react';
import { Track } from 'livekit-client';
import { describe, expect, it, vi } from 'vitest';

import { createAudioPublication, createMockParticipant, defineWritable } from '../../utils/track-test-utils';
import { AudioTrackSubscriptionCache } from './AudioTrackSubscriptionCache';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: () => Promise.resolve(),
}));

describe('AudioTrackSubscriptionCache', () => {
    it('registerWithParticipant() should subscribe and enable the audio track', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('audio-1');
        const participant = createMockParticipant('p1');
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');

        cache.registerWithParticipant(pub, participant);

        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub.isSubscribed).toBe(true);

            expect(setEnabledSpy).toHaveBeenCalledWith(true);
            expect(pub.isEnabled).toBe(true);
        });
    });

    it('registerWithParticipant() should store participant reference', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('audio-1');
        const participant = createMockParticipant('p1');

        cache.registerWithParticipant(pub, participant);

        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        const retrievedParticipant = cache.getParticipantForTrack(pub);
        expect(retrievedParticipant).toBe(participant);
    });

    it('register() should subscribe and enable the audio track using base functionality', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('audio-1');
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');
        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');

        cache.register(pub, 'p1');

        await waitFor(() => {
            expect(setSubscribedSpy).toHaveBeenCalledWith(true);
            expect(pub.isSubscribed).toBe(true);

            expect(setEnabledSpy).toHaveBeenCalledWith(true);
            expect(pub.isEnabled).toBe(true);
        });
    });

    it('register() should ignore non-microphone tracks', () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('track-1');
        defineWritable(pub, 'source', Track.Source.Camera);
        const setSubscribedSpy = vi.spyOn(pub, 'setSubscribed');

        cache.register(pub, 'p1');

        expect(setSubscribedSpy).not.toHaveBeenCalled();
    });

    it('getParticipantForTrack() should return correct participant for registered track', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub1 = createAudioPublication('audio-1');
        const pub2 = createAudioPublication('audio-2');
        const participant1 = createMockParticipant('p1');
        const participant2 = createMockParticipant('p2');

        cache.registerWithParticipant(pub1, participant1);
        cache.registerWithParticipant(pub2, participant2);

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
            expect(pub2.isSubscribed).toBe(true);
        });

        expect(cache.getParticipantForTrack(pub1)).toBe(participant1);
        expect(cache.getParticipantForTrack(pub2)).toBe(participant2);
    });

    it('unregister() should remove participant reference and disable track', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('audio-1', { track: {} });
        const participant = createMockParticipant('p1');

        cache.registerWithParticipant(pub, participant);
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
            expect(pub.isEnabled).toBe(true);
        });

        expect(cache.getParticipantForTrack(pub)).toBe(participant);

        const setEnabledSpy = vi.spyOn(pub, 'setEnabled');
        cache.unregister(pub);

        await waitFor(() => {
            expect(setEnabledSpy).toHaveBeenCalledWith(false);
            expect(pub.isEnabled).toBe(false);
        });

        expect(cache.getParticipantForTrack(pub)).toBeUndefined();
    });

    it('handleTrackUnpublished() should remove participant reference and track from cache', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub = createAudioPublication('audio-1');
        const participant = createMockParticipant('p1');

        cache.registerWithParticipant(pub, participant);
        await waitFor(() => {
            expect(pub.isSubscribed).toBe(true);
        });

        expect(cache.getParticipantForTrack(pub)).toBe(participant);

        cache.handleTrackUnpublished(pub);

        expect(cache.getParticipantForTrack(pub)).toBeUndefined();
    });

    it('should handle multiple registrations and unregistrations', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub1 = createAudioPublication('audio-1', { track: {} });
        const pub2 = createAudioPublication('audio-2', { track: {} });
        const pub3 = createAudioPublication('audio-3', { track: {} });
        const participant1 = createMockParticipant('p1');
        const participant2 = createMockParticipant('p2');
        const participant3 = createMockParticipant('p3');

        cache.registerWithParticipant(pub1, participant1);
        cache.registerWithParticipant(pub2, participant2);
        cache.registerWithParticipant(pub3, participant3);

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
            expect(pub2.isSubscribed).toBe(true);
            expect(pub3.isSubscribed).toBe(true);
        });

        expect(cache.getParticipantForTrack(pub1)).toBe(participant1);
        expect(cache.getParticipantForTrack(pub2)).toBe(participant2);
        expect(cache.getParticipantForTrack(pub3)).toBe(participant3);

        cache.unregister(pub2);

        await waitFor(() => {
            expect(pub2.isEnabled).toBe(false);
        });

        expect(cache.getParticipantForTrack(pub1)).toBe(participant1);
        expect(cache.getParticipantForTrack(pub2)).toBeUndefined();
        expect(cache.getParticipantForTrack(pub3)).toBe(participant3);
    });

    it('should evict least-recently-used unpinned entries when capacity is exceeded', async () => {
        const cache = new AudioTrackSubscriptionCache(1);

        const pub1 = createAudioPublication('audio-1');
        const pub1SetSubscribedSpy = vi.spyOn(pub1, 'setSubscribed');
        const participant1 = createMockParticipant('p1');

        cache.registerWithParticipant(pub1, participant1);
        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
        });

        cache.unregister(pub1);
        await waitFor(() => {
            expect(pub1.isEnabled).toBe(false);
        });

        // Register second track - should immediately evict first track
        const pub2 = createAudioPublication('audio-2');
        const participant2 = createMockParticipant('p2');
        cache.registerWithParticipant(pub2, participant2);
        await waitFor(() => {
            expect(pub2.isSubscribed).toBe(true);
            // pub1 should be evicted and unsubscribed
            expect(pub1SetSubscribedSpy).toHaveBeenCalledWith(false);
            expect(pub1.isSubscribed).toBe(false);
        });

        // Participant reference should also be cleaned up during eviction
        expect(cache.getParticipantForTrack(pub1)).toBeUndefined();
    });

    it('destroy() should clear participant references', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const pub1 = createAudioPublication('audio-1');
        const pub2 = createAudioPublication('audio-2');
        const participant1 = createMockParticipant('p1');
        const participant2 = createMockParticipant('p2');

        cache.registerWithParticipant(pub1, participant1);
        cache.registerWithParticipant(pub2, participant2);

        await waitFor(() => {
            expect(pub1.isSubscribed).toBe(true);
            expect(pub2.isSubscribed).toBe(true);
        });

        expect(cache.getParticipantForTrack(pub1)).toBe(participant1);
        expect(cache.getParticipantForTrack(pub2)).toBe(participant2);

        cache.destroy();

        expect(cache.getParticipantForTrack(pub1)).toBeUndefined();
        expect(cache.getParticipantForTrack(pub2)).toBeUndefined();
    });

    it('getQueueManagedTracksToMonitor() should return only subscribed+enabled+unmuted tracks with track object', async () => {
        const cache = new AudioTrackSubscriptionCache(10);

        const good = createAudioPublication('good');
        const noTrack = createAudioPublication('no-track');
        const muted = createAudioPublication('muted');
        const disabled = createAudioPublication('disabled');

        const participant1 = createMockParticipant('p-good');
        const participant2 = createMockParticipant('p-no-track');
        const participant3 = createMockParticipant('p-muted');
        const participant4 = createMockParticipant('p-disabled');

        cache.registerWithParticipant(good, participant1);
        cache.registerWithParticipant(noTrack, participant2);
        cache.registerWithParticipant(muted, participant3);
        cache.registerWithParticipant(disabled, participant4);

        await waitFor(() => {
            expect(good.isSubscribed).toBe(true);
            expect(noTrack.isSubscribed).toBe(true);
            expect(muted.isSubscribed).toBe(true);
            expect(disabled.isSubscribed).toBe(true);
        });

        // @ts-expect-error - we're mocking the track object
        good.track = {};
        // noTrack has no track object
        // @ts-expect-error - we're mocking the track object
        muted.track = {};
        // @ts-expect-error - we're mocking the track object
        muted.isMuted = true;
        // @ts-expect-error - we're mocking the track object
        disabled.track = {};
        disabled.setEnabled(false);

        const monitored = cache.getQueueManagedTracksToMonitor();
        const sids = monitored.map((p) => p.trackSid).sort();
        expect(sids).toEqual(['good']);
    });
});
