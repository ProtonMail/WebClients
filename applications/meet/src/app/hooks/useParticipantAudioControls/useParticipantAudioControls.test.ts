import { useRoomContext } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';
import { RoomEvent, Track } from 'livekit-client';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sortAudioPublications, useParticipantAudioControls } from './useParticipantAudioControls';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('../useStuckTrackMonitor', () => ({
    useStuckTrackMonitor: vi.fn(),
}));

type EventCallback = (...args: unknown[]) => void;

interface MockPublication {
    trackSid: string;
    source: Track.Source;
    isMuted: boolean;
    isSubscribed: boolean;
    isEnabled: boolean;
    track?: object;
    setSubscribed: Mock;
    setEnabled: Mock;
}

interface MockParticipant {
    identity: string;
    lastSpokeAt?: Date;
    trackPublications: Map<string, MockPublication>;
    audioTrackPublications: Map<string, MockPublication>;
}

interface MockRoom {
    localParticipant: { identity: string };
    remoteParticipants: Map<string, MockParticipant>;
    on: Mock;
    off: Mock;
    emit: (event: RoomEvent, ...args: unknown[]) => void;
    getEventHandler: (event: RoomEvent) => EventCallback | undefined;
}

const createMockPublication = (overrides: Partial<MockPublication> = {}): MockPublication => ({
    trackSid: `track-${Math.random().toString(36).slice(2, 9)}`,
    source: Track.Source.Microphone,
    isMuted: false,
    isSubscribed: false,
    isEnabled: false,
    track: {},
    setSubscribed: vi.fn(function (this: MockPublication, value: boolean) {
        this.isSubscribed = value;
    }),
    setEnabled: vi.fn(function (this: MockPublication, value: boolean) {
        this.isEnabled = value;
    }),
    ...overrides,
});

const createMockParticipant = (identity: string, publications: MockPublication[] = []): MockParticipant => {
    const trackPublications = new Map<string, MockPublication>();
    const audioTrackPublications = new Map<string, MockPublication>();

    publications.forEach((pub) => {
        trackPublications.set(pub.trackSid, pub);
        if (pub.source === Track.Source.Microphone || pub.source === Track.Source.ScreenShareAudio) {
            audioTrackPublications.set(pub.trackSid, pub);
        }
    });

    return {
        identity,
        lastSpokeAt: undefined,
        trackPublications,
        audioTrackPublications,
    };
};

const createMockRoom = (): MockRoom => {
    const eventHandlers = new Map<RoomEvent, EventCallback>();

    const room: MockRoom = {
        localParticipant: { identity: 'local-participant' },
        remoteParticipants: new Map(),
        on: vi.fn((event: RoomEvent, callback: EventCallback) => {
            eventHandlers.set(event, callback);
            return room;
        }),
        off: vi.fn((event: RoomEvent) => {
            eventHandlers.delete(event);
            return room;
        }),
        emit: (event: RoomEvent, ...args: unknown[]) => {
            const handler = eventHandlers.get(event);
            if (handler) {
                handler(...args);
            }
        },
        getEventHandler: (event: RoomEvent) => eventHandlers.get(event),
    };

    return room;
};

describe('sortAudioPublications', () => {
    const createItem = (
        overrides: {
            isMuted?: boolean;
            lastSpokeAt?: Date | undefined;
            hasPublication?: boolean;
        } = {}
    ) => {
        const { isMuted = false, lastSpokeAt = undefined, hasPublication = true } = overrides;

        return {
            publication: hasPublication
                ? ({
                      isMuted,
                  } as any)
                : undefined,
            participant: {
                lastSpokeAt,
            } as any,
        };
    };

    describe('publication presence', () => {
        it('should place items with publication before items without publication', () => {
            const withPub = createItem({ hasPublication: true });
            const withoutPub = createItem({ hasPublication: false });

            const result = sortAudioPublications([withoutPub, withPub]);

            expect(result[0]).toBe(withPub);
            expect(result[1]).toBe(withoutPub);
        });

        it('should handle multiple items without publication', () => {
            const first = { ...createItem({ hasPublication: false }), id: 'first' };
            const second = { ...createItem({ hasPublication: false }), id: 'second' };
            const withPub = { ...createItem({ hasPublication: true }), id: 'withPub' };

            const result = sortAudioPublications([first, withPub, second]) as { id: string }[];

            expect(result[0].id).toBe('withPub');
        });
    });

    describe('muted status sorting', () => {
        it('should place unmuted tracks before muted tracks', () => {
            const muted = createItem({ isMuted: true });
            const unmuted = createItem({ isMuted: false });

            const result = sortAudioPublications([muted, unmuted]);

            expect(result[0]).toBe(unmuted);
            expect(result[1]).toBe(muted);
        });

        it('should place all unmuted tracks before all muted tracks', () => {
            const muted1 = createItem({ isMuted: true });
            const muted2 = createItem({ isMuted: true });
            const unmuted1 = createItem({ isMuted: false });
            const unmuted2 = createItem({ isMuted: false });

            const result = sortAudioPublications([muted1, unmuted1, muted2, unmuted2]);

            expect(result[0].publication?.isMuted).toBe(false);
            expect(result[1].publication?.isMuted).toBe(false);
            expect(result[2].publication?.isMuted).toBe(true);
            expect(result[3].publication?.isMuted).toBe(true);
        });
    });

    describe('lastSpokeAt sorting', () => {
        it('should sort by lastSpokeAt descending when muted status is the same (recent speakers first)', () => {
            const oldest = createItem({ lastSpokeAt: new Date('2024-01-01T00:00:00Z') });
            const middle = createItem({ lastSpokeAt: new Date('2024-01-02T00:00:00Z') });
            const newest = createItem({ lastSpokeAt: new Date('2024-01-03T00:00:00Z') });

            const result = sortAudioPublications([oldest, middle, newest]);

            expect(result[0]).toBe(newest);
            expect(result[1]).toBe(middle);
            expect(result[2]).toBe(oldest);
        });

        it('should treat undefined lastSpokeAt as oldest (timestamp 0) and place at the end', () => {
            const neverSpoke = createItem({ lastSpokeAt: undefined });
            const spokeRecently = createItem({ lastSpokeAt: new Date('2024-01-01T00:00:00Z') });

            const result = sortAudioPublications([neverSpoke, spokeRecently]);

            expect(result[0]).toBe(spokeRecently);
            expect(result[1]).toBe(neverSpoke);
        });

        it('should sort muted tracks by lastSpokeAt descending among themselves', () => {
            const mutedOld = createItem({ isMuted: true, lastSpokeAt: new Date('2024-01-01T00:00:00Z') });
            const mutedNew = createItem({ isMuted: true, lastSpokeAt: new Date('2024-01-03T00:00:00Z') });

            const result = sortAudioPublications([mutedOld, mutedNew]);

            expect(result[0]).toBe(mutedNew);
            expect(result[1]).toBe(mutedOld);
        });

        it('should sort unmuted tracks by lastSpokeAt descending among themselves', () => {
            const unmutedOld = createItem({ isMuted: false, lastSpokeAt: new Date('2024-01-01T00:00:00Z') });
            const unmutedNew = createItem({ isMuted: false, lastSpokeAt: new Date('2024-01-03T00:00:00Z') });

            const result = sortAudioPublications([unmutedOld, unmutedNew]);

            expect(result[0]).toBe(unmutedNew);
            expect(result[1]).toBe(unmutedOld);
        });
    });

    describe('combined sorting priority', () => {
        it('should prioritize muted status over lastSpokeAt (unmuted first)', () => {
            const mutedRecent = createItem({ isMuted: true, lastSpokeAt: new Date('2024-01-03T00:00:00Z') });
            const unmutedOld = createItem({ isMuted: false, lastSpokeAt: new Date('2024-01-01T00:00:00Z') });

            const result = sortAudioPublications([mutedRecent, unmutedOld]);

            // Unmuted should come first regardless of lastSpokeAt
            expect(result[0]).toBe(unmutedOld);
            expect(result[1]).toBe(mutedRecent);
        });

        it('should sort complex mixed array correctly', () => {
            const mutedOld = createItem({ isMuted: true, lastSpokeAt: new Date('2024-01-01T00:00:00Z') });
            const mutedNew = createItem({ isMuted: true, lastSpokeAt: new Date('2024-01-03T00:00:00Z') });
            const unmutedOld = createItem({ isMuted: false, lastSpokeAt: new Date('2024-01-01T00:00:00Z') });
            const unmutedNew = createItem({ isMuted: false, lastSpokeAt: new Date('2024-01-03T00:00:00Z') });
            const noPub = createItem({ hasPublication: false });

            const result = sortAudioPublications([noPub, mutedOld, unmutedNew, mutedNew, unmutedOld]);

            // Expected order (items to keep at front, items to unsubscribe at end):
            // 1. Unmuted new (recent speaker, unmuted - highest priority)
            // 2. Unmuted old (unmuted but older)
            // 3. Muted new (muted but recent)
            // 4. Muted old (muted and old)
            // 5. No publication (always last - to be unsubscribed)
            expect(result[0]).toBe(unmutedNew);
            expect(result[1]).toBe(unmutedOld);
            expect(result[2]).toBe(mutedNew);
            expect(result[3]).toBe(mutedOld);
            expect(result[4]).toBe(noPub);
        });
    });
});

describe('useParticipantAudioControls', () => {
    let mockRoom: MockRoom;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRoom = createMockRoom();
        (useRoomContext as Mock).mockReturnValue(mockRoom);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('screen share audio tracks', () => {
        it('should subscribe to all screen share tracks when room is connected', () => {
            const screenSharePub1 = createMockPublication({
                source: Track.Source.ScreenShareAudio,
                trackSid: 'screen-share-1',
            });
            const screenSharePub2 = createMockPublication({
                source: Track.Source.ScreenShareAudio,
                trackSid: 'screen-share-2',
            });

            const participant1 = createMockParticipant('participant-1', [screenSharePub1]);
            const participant2 = createMockParticipant('participant-2', [screenSharePub2]);

            mockRoom.remoteParticipants.set('participant-1', participant1);
            mockRoom.remoteParticipants.set('participant-2', participant2);

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            expect(screenSharePub1.setSubscribed).toHaveBeenCalledWith(true);
            expect(screenSharePub1.setEnabled).toHaveBeenCalledWith(true);
            expect(screenSharePub2.setSubscribed).toHaveBeenCalledWith(true);
            expect(screenSharePub2.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should subscribe to screen share audio when published', () => {
            const participant = createMockParticipant('participant-1', []);
            mockRoom.remoteParticipants.set('participant-1', participant);

            renderHook(() => useParticipantAudioControls());

            const screenSharePub = createMockPublication({
                source: Track.Source.ScreenShareAudio,
                trackSid: 'screen-share-new',
            });

            mockRoom.emit(RoomEvent.TrackPublished, screenSharePub, participant);

            expect(screenSharePub.setSubscribed).toHaveBeenCalledWith(true);
            expect(screenSharePub.setEnabled).toHaveBeenCalledWith(true);
        });
    });

    describe('microphone tracks subscription', () => {
        it('should subscribe to all microphone tracks when room is connected', () => {
            const micPub1 = createMockPublication({ trackSid: 'mic-1' });
            const micPub2 = createMockPublication({ trackSid: 'mic-2' });
            const micPub3 = createMockPublication({ trackSid: 'mic-3' });

            const participant1 = createMockParticipant('participant-1', [micPub1]);
            const participant2 = createMockParticipant('participant-2', [micPub2]);
            const participant3 = createMockParticipant('participant-3', [micPub3]);

            mockRoom.remoteParticipants.set('participant-1', participant1);
            mockRoom.remoteParticipants.set('participant-2', participant2);
            mockRoom.remoteParticipants.set('participant-3', participant3);

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            expect(micPub1.setSubscribed).toHaveBeenCalledWith(true);
            expect(micPub1.setEnabled).toHaveBeenCalledWith(true);
            expect(micPub2.setSubscribed).toHaveBeenCalledWith(true);
            expect(micPub2.setEnabled).toHaveBeenCalledWith(true);
            expect(micPub3.setSubscribed).toHaveBeenCalledWith(true);
            expect(micPub3.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should subscribe to newly published microphone tracks', () => {
            const participant = createMockParticipant('participant-1', []);
            mockRoom.remoteParticipants.set('participant-1', participant);

            renderHook(() => useParticipantAudioControls());

            const micPub = createMockPublication({ trackSid: 'mic-new' });

            mockRoom.emit(RoomEvent.TrackPublished, micPub, participant);

            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
            expect(micPub.setEnabled).toHaveBeenCalledWith(true);
        });
    });

    describe('microphone track limit (80 tracks)', () => {
        it('should subscribe to up to 80 microphone tracks preferring unmuted tracks and recent speakers', () => {
            // Create 85 participants with microphone tracks
            for (let i = 0; i < 85; i++) {
                const isMuted = i >= 40; // First 40 are unmuted, rest are muted
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Set lastSpokeAt for unmuted tracks (more recent for lower indices)
                if (!isMuted) {
                    participant.lastSpokeAt = new Date(Date.now() - i * 1000);
                }

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // Count subscribed tracks
            let subscribedCount = 0;
            for (const participant of mockRoom.remoteParticipants.values()) {
                for (const pub of participant.trackPublications.values()) {
                    if (pub.setSubscribed.mock.calls.some((call) => call[0] === true)) {
                        subscribedCount++;
                    }
                }
            }

            expect(subscribedCount).toBe(80);
        });

        it('should not subscribe to participants with oldest lastSpokeAt when all are unmuted and limit is exceeded', () => {
            // Create 85 unmuted participants with varying lastSpokeAt times
            for (let i = 0; i < 85; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Higher index = more recent speaker (higher lastSpokeAt timestamp)
                participant.lastSpokeAt = new Date(Date.now() - (85 - i) * 60000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // Participants 0-4 have the lowest lastSpokeAt values (oldest speakers)
            // They should NOT be subscribed because the limit is 80
            for (let i = 0; i < 5; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                const wasSubscribed = pub?.setSubscribed.mock.calls.some((call) => call[0] === true);
                expect(wasSubscribed).toBe(false);
            }

            // Participants 5-84 should be subscribed (recent speakers)
            for (let i = 5; i < 85; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                const wasSubscribed = pub?.setSubscribed.mock.calls.some((call) => call[0] === true);
                expect(wasSubscribed).toBe(true);
            }
        });

        it('should unsubscribe from muted tracks first if limit is reached', () => {
            // Start with 79 tracks
            for (let i = 0; i < 79; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: i >= 39, // Half unmuted, half muted
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                if (i < 39) {
                    participant.lastSpokeAt = new Date(Date.now() - i * 1000);
                }

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // Now add 3 more unmuted tracks to exceed limit
            for (let i = 79; i < 82; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                participant.lastSpokeAt = new Date(Date.now());

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);

                mockRoom.emit(RoomEvent.TrackPublished, micPub, participant);
            }

            // Find tracks that were unsubscribed
            const unsubscribedTracks: string[] = [];
            for (const participant of mockRoom.remoteParticipants.values()) {
                for (const pub of participant.trackPublications.values()) {
                    const calls = pub.setSubscribed.mock.calls;
                    // Check if last call was to unsubscribe
                    if (calls.length > 0 && calls[calls.length - 1][0] === false) {
                        unsubscribedTracks.push(pub.trackSid);
                    }
                }
            }

            // Muted tracks should be unsubscribed first
            expect(unsubscribedTracks.length).toBeGreaterThan(0);
            for (const trackSid of unsubscribedTracks) {
                const trackIndex = parseInt(trackSid.replace('mic-', ''), 10);
                // The muted tracks are indices >= 39, so those should be unsubscribed
                expect(trackIndex).toBeGreaterThanOrEqual(39);
            }
        });

        it('should unsubscribe from tracks that have not spoken in a while if limit is reached', () => {
            // Create 80 unmuted tracks with varying lastSpokeAt times

            for (let i = 0; i < 80; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Participants 0-39 never spoke (lastSpokeAt undefined → treated as 0)
                // Participants 40-79 have recent speaking activity
                if (i >= 40) {
                    participant.lastSpokeAt = new Date(Date.now() - (80 - i) * 1000); // Recent speakers
                }

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // Add a new track from a participant who just spoke (recent speaker)
            const newMicPub = createMockPublication({
                trackSid: 'mic-new',
                isMuted: false,
            });

            const newParticipant = createMockParticipant('participant-new', [newMicPub]);
            newParticipant.lastSpokeAt = new Date(Date.now()); // Just spoke

            mockRoom.remoteParticipants.set('participant-new', newParticipant);

            mockRoom.emit(RoomEvent.TrackPublished, newMicPub, newParticipant);

            // After sorting descending, recent speakers are at the front,
            // and tracks with undefined lastSpokeAt (never spoke) are at the end
            // One of the participants who never spoke (0-39) should be unsubscribed
            let unsubscribedNeverSpokeParticipant = false;
            for (let i = 0; i < 40; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                const setSubscribedCalls = pub?.setSubscribed.mock.calls ?? [];
                const lastCall = setSubscribedCalls[setSubscribedCalls.length - 1];
                if (lastCall?.[0] === false) {
                    unsubscribedNeverSpokeParticipant = true;
                    break;
                }
            }

            expect(unsubscribedNeverSpokeParticipant).toBe(true);

            // Verify that participants who spoke recently (40-79) were NOT unsubscribed
            for (let i = 40; i < 80; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                const setSubscribedCalls = pub?.setSubscribed.mock.calls ?? [];
                const lastCall = setSubscribedCalls[setSubscribedCalls.length - 1];
                // Last call should be subscribe (true), not unsubscribe
                expect(lastCall?.[0]).toBe(true);
            }
        });
    });

    describe('active speaker handling', () => {
        it('should add previously unsubscribed active speaker to cache and unsubscribe oldest track', () => {
            // Create 85 participants
            // With descending sort, older speakers (lower indices) are not subscribed
            const participants: MockParticipant[] = [];
            for (let i = 0; i < 85; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                    isSubscribed: false,
                    isEnabled: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Lower index = older speaker
                participant.lastSpokeAt = new Date(Date.now() - (85 - i) * 60000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
                participants.push(participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // Initially: participants 5-84 are subscribed (80 tracks, most recent speakers)
            // Participants 0-4 are NOT subscribed (oldest speakers, beyond limit)
            const oldParticipant = participants[0];
            const oldPub = oldParticipant.trackPublications.get('mic-0')!;

            // Verify participant 0 was not subscribed initially
            expect(oldPub.setSubscribed).not.toHaveBeenCalled();

            // Simulate LiveKit updating lastSpokeAt when participant becomes active speaker
            oldParticipant.lastSpokeAt = new Date(Date.now());

            // Make this participant an active speaker
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [oldParticipant]);

            // When ActiveSpeakersChanged is called for an unsubscribed track, handleCacheUpdate
            // adds the track to the cache (now 81 items) and triggers unsubscription of the oldest.
            // Cache before: [participants 5-84] (80 items)
            // Cache after adding participant-0: [participant-0, participants 5-84] (81 items)
            // After sorting by lastSpokeAt descending, participant-5 (oldest in the original set)
            // ends up at position 80 and gets unsubscribed.
            const participant5 = participants[5];
            const pub5 = participant5.trackPublications.get('mic-5')!;

            const setSubscribedCalls = pub5?.setSubscribed.mock.calls ?? [];
            const lastCall = setSubscribedCalls[setSubscribedCalls.length - 1];
            expect(lastCall?.[0]).toBe(false);
        });
    });

    describe('track unmuted handling', () => {
        it('should subscribe to track when unmuted if it was not subscribed', () => {
            // Create 81 participants - one more than the cache limit
            // The target participant (80) will be muted and oldest speaker, so lowest priority
            for (let i = 0; i < 81; i++) {
                const isMuted = i === 80; // Only the last participant is muted
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted,
                    isSubscribed: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Participant 80 has oldest lastSpokeAt (lowest priority)
                participant.lastSpokeAt = new Date(Date.now() - i * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());
            mockRoom.emit(RoomEvent.Connected);

            // Get the muted participant (participant 80) - should not be subscribed
            const targetParticipant = mockRoom.remoteParticipants.get('participant-80')!;
            const targetPub = targetParticipant.trackPublications.get('mic-80')!;

            // Verify it was NOT subscribed (it's outside the cache limit due to being muted + oldest)
            expect(targetPub.setSubscribed).not.toHaveBeenCalledWith(true);

            // Clear mock to track new calls
            targetPub.setSubscribed.mockClear();

            // Unmute the track
            targetPub.isMuted = false;
            mockRoom.emit(RoomEvent.TrackUnmuted, targetPub, targetParticipant);

            // Now it should be subscribed
            expect(targetPub.setSubscribed).toHaveBeenCalledWith(true);
        });
    });

    describe('track unpublished handling', () => {
        it('should remove unpublished track from cache allowing new tracks to be subscribed', () => {
            // Start with exactly 80 tracks (at the limit)
            for (let i = 0; i < 80; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                participant.lastSpokeAt = new Date(Date.now() - i * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            // All 80 tracks should be subscribed
            const participant0 = mockRoom.remoteParticipants.get('participant-0')!;
            const pub0 = participant0.trackPublications.get('mic-0')!;
            expect(pub0.setSubscribed).toHaveBeenCalledWith(true);

            // Unpublish track from participant-0
            mockRoom.emit(RoomEvent.TrackUnpublished, pub0, participant0);

            // Now add a new participant - should be subscribed since we're below the limit
            const newMicPub = createMockPublication({
                trackSid: 'mic-new',
                isMuted: false,
            });
            const newParticipant = createMockParticipant('participant-new', [newMicPub]);
            newParticipant.lastSpokeAt = new Date(Date.now());

            mockRoom.remoteParticipants.set('participant-new', newParticipant);

            mockRoom.emit(RoomEvent.TrackPublished, newMicPub, newParticipant);

            // The new track should be subscribed (we're at 80 again, not 81)
            expect(newMicPub.setSubscribed).toHaveBeenCalledWith(true);

            // Verify no tracks were unsubscribed (we're exactly at the limit)
            for (let i = 1; i < 80; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                const calls = pub?.setSubscribed.mock.calls ?? [];
                const lastCall = calls[calls.length - 1];
                // Last call should still be subscribe (true), not unsubscribe
                expect(lastCall?.[0]).toBe(true);
            }
        });
    });

    describe('local participant filtering', () => {
        it('should not subscribe to local participant tracks', () => {
            const localMicPub = createMockPublication({ trackSid: 'local-mic' });
            const localParticipant = createMockParticipant('local-participant', [localMicPub]);

            mockRoom.remoteParticipants.set('local-participant', localParticipant);

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.Connected);

            expect(localMicPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should ignore track published events from local participant', () => {
            const localMicPub = createMockPublication({ trackSid: 'local-mic' });
            const localParticipant = createMockParticipant('local-participant', [localMicPub]);

            renderHook(() => useParticipantAudioControls());

            mockRoom.emit(RoomEvent.TrackPublished, localMicPub, localParticipant);

            expect(localMicPub.setSubscribed).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should unregister event handlers on unmount', () => {
            const { unmount } = renderHook(() => useParticipantAudioControls());

            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackPublished, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackUnmuted, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackUnpublished, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Connected, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.ActiveSpeakersChanged, expect.any(Function));

            unmount();

            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackPublished, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackUnmuted, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackUnpublished, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.Connected, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
        });
    });
});
