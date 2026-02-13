import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioTrackSubscriptionManager, sortAudioPublications } from './AudioTrackSubscriptionManager';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: vi.fn().mockResolvedValue(undefined),
}));

type EventCallback = (...args: unknown[]) => void;

interface MockPublication {
    trackSid: string;
    source: Track.Source;
    isMuted: boolean;
    isSubscribed: boolean;
    isEnabled: boolean;
    track?: {
        mediaStreamTrack?: {
            id?: string;
            readyState?: string;
        };
    };
    setSubscribed: Mock;
    setEnabled: Mock;
}

interface MockParticipant {
    sid: string;
    identity: string;
    lastSpokeAt?: Date;
    trackPublications: Map<string, MockPublication>;
    audioTrackPublications: Map<string, MockPublication>;
}

interface MockRoom {
    localParticipant: { identity: string };
    remoteParticipants: Map<string, MockParticipant>;
    state?: string;
    engine?: {
        pcManager?: {
            subscriber?: {
                pc?: {
                    getStats: Mock;
                };
            };
        };
    };
    on: Mock;
    off: Mock;
    emit: (event: RoomEvent, ...args: unknown[]) => void;
    getEventHandler: (event: RoomEvent) => EventCallback | undefined;
}

const createMockPublication = (overrides: Partial<MockPublication> = {}): MockPublication => {
    const trackSid = overrides.trackSid || `track-${Math.random().toString(36).slice(2, 9)}`;
    return {
        trackSid,
        source: Track.Source.Microphone,
        isMuted: false,
        isSubscribed: false,
        isEnabled: false,
        track: {
            mediaStreamTrack: {
                id: `media-${trackSid}`,
                readyState: 'live',
            },
        },
        setSubscribed: vi.fn(function (this: MockPublication, value: boolean) {
            this.isSubscribed = value;
        }),
        setEnabled: vi.fn(function (this: MockPublication, value: boolean) {
            this.isEnabled = value;
        }),
        ...overrides,
    };
};

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
        sid: `sid-${identity}`,
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
        state: ConnectionState.Connected,
        engine: {
            pcManager: {
                subscriber: {
                    pc: {
                        getStats: vi.fn().mockResolvedValue(new Map()),
                    },
                },
            },
        },
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

describe('AudioTrackSubscriptionManager', () => {
    let mockRoom: MockRoom;
    let cache: AudioTrackSubscriptionManager;
    let mockReportError: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRoom = createMockRoom();
        mockReportError = vi.fn();
        cache = new AudioTrackSubscriptionManager(80, mockRoom as any, mockReportError);
        cache.listenToRoomEvents();
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

            mockRoom.emit(RoomEvent.Connected);

            expect(screenSharePub1.setSubscribed).toHaveBeenCalledWith(true);
            expect(screenSharePub1.setEnabled).toHaveBeenCalledWith(true);
            expect(screenSharePub2.setSubscribed).toHaveBeenCalledWith(true);
            expect(screenSharePub2.setEnabled).toHaveBeenCalledWith(true);
        });

        it('should subscribe to screen share audio when published', () => {
            const participant = createMockParticipant('participant-1', []);
            mockRoom.remoteParticipants.set('participant-1', participant);

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

            mockRoom.emit(RoomEvent.Connected);

            expect(localMicPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should ignore track published events from local participant', () => {
            const localMicPub = createMockPublication({ trackSid: 'local-mic' });
            const localParticipant = createMockParticipant('local-participant', [localMicPub]);

            mockRoom.emit(RoomEvent.TrackPublished, localMicPub, localParticipant);

            expect(localMicPub.setSubscribed).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should unregister event handlers on cleanup', () => {
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackPublished, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackUnmuted, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.TrackUnpublished, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Connected, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.ParticipantDisconnected, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.ActiveSpeakersChanged, expect.any(Function));
            expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.ConnectionStateChanged, expect.any(Function));

            cache.cleanupEventListeners();

            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackPublished, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackUnmuted, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.TrackUnpublished, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.Connected, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ParticipantDisconnected, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ActiveSpeakersChanged, expect.any(Function));
            expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ConnectionStateChanged, expect.any(Function));
        });

        it('should clear all intervals and recovery state on cleanup', () => {
            vi.useFakeTimers();

            cache.setupReconcileLoop();
            cache.setupHealthCheckLoop();

            const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

            cache.cleanup();

            expect(clearIntervalSpy).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe('reconcile', () => {
        it('should reconcile audio tracks when the limit is not reached and track subscriptions were missed', () => {
            // Create 50 participants with microphone tracks first
            for (let i = 0; i < 50; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                    isSubscribed: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                participant.lastSpokeAt = new Date(Date.now() - i * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            // Emit Connected event to properly handle the first 50 tracks
            mockRoom.emit(RoomEvent.Connected);

            // Verify the first 50 were subscribed through the normal flow
            for (let i = 0; i < 50; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                expect(pub?.setSubscribed).toHaveBeenCalledWith(true);
            }

            // Now add 20 more participants WITHOUT firing events (simulating missed track publications)
            for (let i = 50; i < 70; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                    isSubscribed: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                participant.lastSpokeAt = new Date(Date.now() - i * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            // Now call reconcile - it should detect and subscribe to the 20 missing tracks
            cache.reconcileAudioTracks();

            // The 20 missed tracks (50-69) should now be subscribed
            for (let i = 50; i < 70; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                // Check that setSubscribed was called with true for the missed tracks
                expect(pub?.setSubscribed).toHaveBeenCalledWith(true);
                expect(pub?.setEnabled).toHaveBeenCalledWith(true);
            }

            // Verify no tracks were unsubscribed (we're under the limit of 80)
            for (let i = 0; i < 70; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                // setSubscribed should never have been called with false
                expect(pub?.setSubscribed).not.toHaveBeenCalledWith(false);
            }
        });

        it('should reconcile audio tracks when the limit is reached and evict the lowest priority items', () => {
            // Create 80 participants with microphone tracks (at the limit)
            for (let i = 0; i < 80; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                    isSubscribed: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // Lower indices have older lastSpokeAt (lower priority)
                participant.lastSpokeAt = new Date(Date.now() - (80 - i) * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            // Emit Connected event to properly subscribe the first 80 tracks through the normal flow
            mockRoom.emit(RoomEvent.Connected);

            // Verify the first 80 were subscribed
            for (let i = 0; i < 80; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                expect(pub?.setSubscribed).toHaveBeenCalledWith(true);
            }

            // Now add 5 new high-priority participants to the room WITHOUT firing events
            // (simulating missed track publications for recent speakers)
            for (let i = 80; i < 85; i++) {
                const micPub = createMockPublication({
                    trackSid: `mic-${i}`,
                    isMuted: false,
                    isSubscribed: false,
                });

                const participant = createMockParticipant(`participant-${i}`, [micPub]);
                // These are the most recent speakers (highest priority)
                participant.lastSpokeAt = new Date(Date.now() + (i - 79) * 1000);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
            }

            // Call reconcile - it should subscribe to the 5 new high-priority tracks
            // and evict the 5 lowest priority tracks
            cache.reconcileAudioTracks();

            // The 5 new high-priority tracks should be subscribed
            for (let i = 80; i < 85; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                expect(pub?.setSubscribed).toHaveBeenCalledWith(true);
                expect(pub?.setEnabled).toHaveBeenCalledWith(true);
            }

            // The 5 lowest priority tracks (oldest speakers, indices 0-4) should be unsubscribed
            for (let i = 0; i < 5; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);
                const calls = pub?.setSubscribed.mock.calls ?? [];

                // Should have been called with false (unsubscribed)
                expect(calls.some((call) => call[0] === false)).toBe(true);
            }

            // The middle participants (indices 5-79) should remain subscribed and not be unsubscribed
            for (let i = 5; i < 80; i++) {
                const participant = mockRoom.remoteParticipants.get(`participant-${i}`);
                const pub = participant?.trackPublications.get(`mic-${i}`);

                // Should not have been unsubscribed
                expect(pub?.setSubscribed).not.toHaveBeenCalledWith(false);
            }
        });
    });

    describe('participant disconnected handling', () => {
        it('should cleanup recovery state when participant disconnects', () => {
            const micPub = createMockPublication({ trackSid: 'mic-1' });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            mockRoom.emit(RoomEvent.Connected);

            // Manually add some recovery state for this participant
            const trackKey = `${participant.sid}-${micPub.trackSid}`;
            (cache as any).recoveryAttempts.set(trackKey, 1);
            (cache as any).activeRecoveries.add(trackKey);

            const cleanupRecoverySpy = vi.spyOn(cache as any, 'cleanupRecovery');

            mockRoom.emit(RoomEvent.ParticipantDisconnected, participant);

            // Verify that cleanup was called for this participant's tracks
            expect(cleanupRecoverySpy).toHaveBeenCalledWith(trackKey);
        });

        it('should handle participant disconnect with no recovery state gracefully', () => {
            const participant = createMockParticipant('participant-2', []);

            // Should not throw when there's no recovery state
            expect(() => {
                mockRoom.emit(RoomEvent.ParticipantDisconnected, participant);
            }).not.toThrow();
        });
    });

    describe('room disconnected handling', () => {
        it('should clear all recovery state and timeouts on disconnect', () => {
            const micPub1 = createMockPublication({ trackSid: 'mic-1' });
            const participant1 = createMockParticipant('participant-1', [micPub1]);

            mockRoom.remoteParticipants.set('participant-1', participant1);
            cache.addToCache(micPub1 as any, participant1 as any);

            // Add recovery state with a timeout
            const trackKey = `${participant1.sid}-${micPub1.trackSid}`;
            const mockTimeout = setTimeout(() => {}, 5000) as any;
            (cache as any).recoveryTimeouts.set(trackKey, mockTimeout);
            (cache as any).recoveryAttempts.set(trackKey, 1);
            (cache as any).activeRecoveries.add(trackKey);

            // Verify state is set up
            expect((cache as any).recoveryTimeouts.size).toBe(1);
            expect((cache as any).subscribedMicrophoneTrackPublications.size).toBeGreaterThan(0);

            mockRoom.emit(RoomEvent.Disconnected);

            // Verify all internal state is cleared
            expect((cache as any).subscribedMicrophoneTrackPublications.size).toBe(0);
            expect((cache as any).recoveryAttempts.size).toBe(0);
            expect((cache as any).recoveryTimeouts.size).toBe(0);
            expect((cache as any).activeRecoveries.size).toBe(0);
            expect((cache as any).lastPacketCounts.size).toBe(0);
            expect((cache as any).firstSeenWithoutStats.size).toBe(0);

            // Clean up the timeout
            clearTimeout(mockTimeout);
        });
    });

    describe('health check and recovery', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should setup health check interval', () => {
            const setIntervalSpy = vi.spyOn(global, 'setInterval');

            cache.setupHealthCheckLoop();

            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
        });

        it('should not check broken transceivers when room is not connected', async () => {
            mockRoom.state = ConnectionState.Disconnected;

            const getStatsSpy = mockRoom.engine?.pcManager?.subscriber?.pc?.getStats;

            await (cache as any).checkBrokenTransceivers();

            expect(getStatsSpy).not.toHaveBeenCalled();
        });

        it('should detect missing inbound-rtp stats after grace period and attempt recovery', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Mock getStats to return empty stats (no inbound-rtp)
            const mockStats = new Map();
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // First check - should start tracking missing stats
            await (cache as any).checkBrokenTransceivers();
            expect(micPub.setSubscribed).not.toHaveBeenCalledWith(false);

            // Advance time past grace period (5 seconds)
            vi.advanceTimersByTime(6000);

            // Second check - should trigger recovery
            await (cache as any).checkBrokenTransceivers();

            // Wait for recovery attempt
            await vi.runAllTimersAsync();

            // Should have attempted to unsubscribe and resubscribe
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
        });

        it('should detect stalled packets and attempt recovery', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return inbound-rtp with stalled packet count
            const createMockStats = (packetsReceived: number) => {
                const mockStats = new Map();
                mockStats.set('inbound-rtp-1', {
                    type: 'inbound-rtp',
                    kind: 'audio',
                    trackIdentifier: trackId,
                    packetsReceived,
                });
                return mockStats;
            };

            // First check with 100 packets
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(createMockStats(100));
            await (cache as any).checkBrokenTransceivers();

            // Second check with same 100 packets (stalled)
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(createMockStats(100));
            await (cache as any).checkBrokenTransceivers();

            await vi.runAllTimersAsync();

            // Should have attempted recovery
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
        });

        it('should not attempt recovery if already recovering', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return stalled packets
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                packetsReceived: 100,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // First check to establish baseline
            await (cache as any).checkBrokenTransceivers();

            // Second check to trigger recovery
            await (cache as any).checkBrokenTransceivers();
            const firstCallCount = micPub.setSubscribed.mock.calls.length;

            // Third check while recovery is in progress (should not trigger another recovery)
            await (cache as any).checkBrokenTransceivers();
            const secondCallCount = micPub.setSubscribed.mock.calls.length;

            // Call count should not have increased (no new recovery attempt)
            expect(secondCallCount).toBe(firstCallCount);
        });

        it('should stop recovery after max attempts', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            // Set readyState to 'ended' so recovery keeps failing
            micPub.track = {
                mediaStreamTrack: {
                    id: `media-mic-1`,
                    readyState: 'ended',
                },
            };

            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return stalled packets
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                packetsReceived: 100,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // Establish baseline
            await (cache as any).checkBrokenTransceivers();

            // Attempt recovery 3 times (max attempts)
            for (let i = 0; i < 3; i++) {
                await (cache as any).checkBrokenTransceivers();
                await vi.runAllTimersAsync();
                // Advance past recovery cooldown (5 seconds)
                vi.advanceTimersByTime(6000);
            }

            const callCountAfterMaxAttempts = micPub.setSubscribed.mock.calls.length;

            // Try one more time - should not attempt recovery
            await (cache as any).checkBrokenTransceivers();
            await vi.runAllTimersAsync();

            const finalCallCount = micPub.setSubscribed.mock.calls.length;

            // Should not have made additional calls after max attempts
            expect(finalCallCount).toBe(callCountAfterMaxAttempts);
        });

        it('should skip tracks in recovery during reconciliation', () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: false });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Manually set the track as recovering
            const trackKey = `${participant.sid}-${micPub.trackSid}`;
            (cache as any).activeRecoveries.add(trackKey);

            // Call reconcile
            cache.reconcileAudioTracks();

            // Should not have tried to resubscribe because it's in recovery
            expect(micPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should skip recovery attempts when room is reconnecting', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Simulate room reconnecting
            mockRoom.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Reconnecting);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return stalled packets
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                packetsReceived: 100,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // First check to establish baseline
            await (cache as any).checkBrokenTransceivers();

            // Second check to trigger recovery (but should be skipped due to reconnecting)
            await (cache as any).checkBrokenTransceivers();

            await vi.runAllTimersAsync();

            // Should not have attempted recovery because room is reconnecting
            expect(micPub.setSubscribed).not.toHaveBeenCalledWith(false);
        });

        it('should resume recovery attempts when room reconnects', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Simulate room reconnecting then reconnected
            mockRoom.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Reconnecting);
            mockRoom.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Connected);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return stalled packets
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                packetsReceived: 100,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // First check to establish baseline
            await (cache as any).checkBrokenTransceivers();

            // Second check to trigger recovery (should work now that room is connected)
            await (cache as any).checkBrokenTransceivers();

            await vi.runAllTimersAsync();

            // Should have attempted recovery because room is connected again
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
        });
    });

    describe('audio concealment monitoring', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should not check audio concealment when room is not connected', async () => {
            mockRoom.state = ConnectionState.Disconnected;

            const getStatsSpy = mockRoom.engine?.pcManager?.subscriber?.pc?.getStats;

            await (cache as any).checkAudioConcealment();

            expect(getStatsSpy).not.toHaveBeenCalled();
        });

        it('should detect high audio concealment after consecutive checks and attempt recovery', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return high concealment (57% like in the user's log)
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 5873,
                totalSamplesReceived: 10220,
                silentConcealedSamples: 5860,
                concealmentEvents: 54,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // First check - should not trigger recovery yet (needs 2 consecutive)
            await (cache as any).checkAudioConcealment();
            expect(micPub.setSubscribed).not.toHaveBeenCalledWith(false);

            // Second check - should trigger recovery
            await (cache as any).checkAudioConcealment();
            await vi.runAllTimersAsync();

            // Should have attempted recovery
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
            expect(mockReportError).toHaveBeenCalledWith(
                'AudioTrackSubscriptionManager: High audio concealment detected',
                expect.objectContaining({
                    level: 'warning',
                    context: expect.objectContaining({
                        participant: participant.identity,
                        trackSid: micPub.trackSid,
                        concealmentRatio: '0.575',
                    }),
                })
            );
        });

        it('should not trigger recovery if concealment is below threshold', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return low concealment (10%)
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 100,
                totalSamplesReceived: 1000,
                silentConcealedSamples: 90,
                concealmentEvents: 5,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // Multiple checks - should not trigger recovery
            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();
            await vi.runAllTimersAsync();

            // Should not have attempted recovery
            expect(micPub.setSubscribed).not.toHaveBeenCalledWith(false);
        });

        it('should reset consecutive count when concealment returns to normal', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // First check with high concealment
            const highConcealmentStats = new Map();
            highConcealmentStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 4000,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 3950,
                concealmentEvents: 20,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(highConcealmentStats);
            await (cache as any).checkAudioConcealment();

            // Second check with normal concealment (should reset counter)
            const normalStats = new Map();
            normalStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 100,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 90,
                concealmentEvents: 5,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(normalStats);
            await (cache as any).checkAudioConcealment();

            // Third check with high concealment again - should need 2 consecutive again
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(highConcealmentStats);
            await (cache as any).checkAudioConcealment();

            // Should not have triggered recovery yet (only 1 consecutive after reset)
            expect(micPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should report when multiple tracks have high concealment (E2EE overload)', async () => {
            // Create 4 participants with high concealment
            for (let i = 0; i < 4; i++) {
                const micPub = createMockPublication({ trackSid: `mic-${i}`, isSubscribed: true });
                const participant = createMockParticipant(`participant-${i}`, [micPub]);

                mockRoom.remoteParticipants.set(`participant-${i}`, participant);
                cache.addToCache(micPub as any, participant as any);
            }

            // Mock getStats to return high concealment for all tracks
            const mockStats = new Map();
            for (let i = 0; i < 4; i++) {
                const trackId = `media-mic-${i}`;
                mockStats.set(`inbound-rtp-${i}`, {
                    type: 'inbound-rtp',
                    kind: 'audio',
                    trackIdentifier: trackId,
                    concealedSamples: 4000,
                    totalSamplesReceived: 10000,
                    silentConcealedSamples: 3950,
                    concealmentEvents: 20,
                });
            }
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // Two consecutive checks to trigger the overload detection
            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();

            // Should report E2EE overload
            expect(mockReportError).toHaveBeenCalledWith(
                'AudioTrackSubscriptionManager: Multiple tracks with high concealment (E2EE overload)',
                expect.objectContaining({
                    level: 'warning',
                    context: expect.objectContaining({
                        affectedTracks: 4,
                        totalSubscribedTracks: 4,
                    }),
                })
            );
        });

        it('should skip concealment check for muted or unsubscribed tracks', async () => {
            const mutedPub = createMockPublication({
                trackSid: 'mic-muted',
                isSubscribed: true,
                isMuted: true,
            });
            const unsubscribedPub = createMockPublication({
                trackSid: 'mic-unsub',
                isSubscribed: false,
                isMuted: false,
            });

            const participant1 = createMockParticipant('participant-1', [mutedPub]);
            const participant2 = createMockParticipant('participant-2', [unsubscribedPub]);

            mockRoom.remoteParticipants.set('participant-1', participant1);
            mockRoom.remoteParticipants.set('participant-2', participant2);
            cache.addToCache(mutedPub as any, participant1 as any);
            cache.addToCache(unsubscribedPub as any, participant2 as any);

            // Mock getStats to return high concealment
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: 'media-mic-muted',
                concealedSamples: 5000,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 4950,
                concealmentEvents: 20,
            });
            mockStats.set('inbound-rtp-2', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: 'media-mic-unsub',
                concealedSamples: 5000,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 4950,
                concealmentEvents: 20,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // Multiple checks - should not trigger recovery for muted/unsubscribed
            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();
            await vi.runAllTimersAsync();

            expect(mutedPub.setSubscribed).not.toHaveBeenCalled();
            expect(unsubscribedPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should skip concealment check if already recovering', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Manually set the track as recovering
            const trackKey = `${participant.sid}-${micPub.trackSid}`;
            (cache as any).activeRecoveries.add(trackKey);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return high concealment
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 5000,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 4950,
                concealmentEvents: 20,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();

            // Should not attempt recovery because already recovering
            expect(micPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should skip concealment recovery when room is reconnecting', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Simulate room reconnecting
            mockRoom.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Reconnecting);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats to return high concealment
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 5000,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 4950,
                concealmentEvents: 20,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            // Two checks to try to trigger recovery
            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();
            await vi.runAllTimersAsync();

            // Should not have attempted recovery because room is reconnecting
            expect(micPub.setSubscribed).not.toHaveBeenCalledWith(false);
        });

        it('should ignore tracks with insufficient samples', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Mock getStats with less than 1000 samples (threshold)
            const mockStats = new Map();
            mockStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 450,
                totalSamplesReceived: 500,
                silentConcealedSamples: 440,
                concealmentEvents: 5,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(mockStats);

            await (cache as any).checkAudioConcealment();
            await (cache as any).checkAudioConcealment();

            // Should not trigger recovery for insufficient samples
            expect(micPub.setSubscribed).not.toHaveBeenCalled();
        });

        it('should cleanup concealment tracking state on recovery cleanup', () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            const trackKey = `${participant.sid}-${micPub.trackSid}`;

            // Set up concealment tracking state
            (cache as any).consecutiveHighConcealment.set(trackKey, 2);
            (cache as any).recoveryAttempts.set(trackKey, 1);

            // Call cleanup
            (cache as any).cleanupRecovery(trackKey);

            // Verify concealment state is cleared
            expect((cache as any).consecutiveHighConcealment.has(trackKey)).toBe(false);
            expect((cache as any).recoveryAttempts.has(trackKey)).toBe(false);
        });

        it('should clear concealment state on room disconnect', () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            const trackKey = `${participant.sid}-${micPub.trackSid}`;

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            // Set up concealment tracking state
            (cache as any).consecutiveHighConcealment.set(trackKey, 2);

            mockRoom.emit(RoomEvent.Disconnected);

            // Verify concealment state is cleared
            expect((cache as any).consecutiveHighConcealment.size).toBe(0);
        });

        it('should detect recent high concealment immediately (delta-based fast detection)', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // First check: 30 seconds of good audio (1,440,000 samples @ 48kHz)
            const goodAudioStats = new Map();
            goodAudioStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 1000, // < 0.1% concealment
                totalSamplesReceived: 1440000,
                silentConcealedSamples: 900,
                concealmentEvents: 5,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(goodAudioStats);
            await (cache as any).checkAudioConcealment();

            // Should not trigger (good audio)
            expect(micPub.setSubscribed).not.toHaveBeenCalled();

            // Second check: Audio breaks! 3 more seconds, all concealed (144,000 new samples, all bad)
            // Total: 1.08% cumulative (below 30% threshold)
            // Recent: 100% of new samples concealed (above 80% threshold - should trigger immediately!)
            const brokenAudioStats = new Map();
            brokenAudioStats.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 145000,
                totalSamplesReceived: 1584000,
                silentConcealedSamples: 144900,
                concealmentEvents: 50,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(brokenAudioStats);
            await (cache as any).checkAudioConcealment();

            await vi.runAllTimersAsync();

            // Should trigger immediately due to high recent concealment (80%+)
            // even though cumulative is only 9.2%
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(micPub.setSubscribed).toHaveBeenCalledWith(true);
            expect(mockReportError).toHaveBeenCalledWith(
                'AudioTrackSubscriptionManager: High audio concealment detected',
                expect.objectContaining({
                    level: 'warning',
                    context: expect.objectContaining({
                        participant: participant.identity,
                        trackSid: micPub.trackSid,
                        triggerReason: 'recent_samples_critical',
                        recentConcealmentRatio: '1.000',
                    }),
                })
            );
        });

        it('should report trigger reason correctly for cumulative vs recent concealment', async () => {
            const micPub = createMockPublication({ trackSid: 'mic-1', isSubscribed: true });
            const participant = createMockParticipant('participant-1', [micPub]);

            mockRoom.remoteParticipants.set('participant-1', participant);
            cache.addToCache(micPub as any, participant as any);

            const trackId = micPub.track?.mediaStreamTrack?.id;

            // Gradual degradation: 35% cumulative but only 40% recent
            const gradualDegradationStats1 = new Map();
            gradualDegradationStats1.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 3500,
                totalSamplesReceived: 10000,
                silentConcealedSamples: 3400,
                concealmentEvents: 20,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(gradualDegradationStats1);
            await (cache as any).checkAudioConcealment();

            // First check doesn't trigger (needs 2 consecutive)
            expect(micPub.setSubscribed).not.toHaveBeenCalled();

            // Second check: still gradual degradation
            const gradualDegradationStats2 = new Map();
            gradualDegradationStats2.set('inbound-rtp-1', {
                type: 'inbound-rtp',
                kind: 'audio',
                trackIdentifier: trackId,
                concealedSamples: 7000,
                totalSamplesReceived: 20000,
                silentConcealedSamples: 6800,
                concealmentEvents: 40,
            });
            mockRoom.engine!.pcManager!.subscriber!.pc!.getStats.mockResolvedValue(gradualDegradationStats2);
            await (cache as any).checkAudioConcealment();

            await vi.runAllTimersAsync();

            // Should trigger after 2 consecutive checks with cumulative reason
            expect(micPub.setSubscribed).toHaveBeenCalledWith(false);
            expect(mockReportError).toHaveBeenCalledWith(
                'AudioTrackSubscriptionManager: High audio concealment detected',
                expect.objectContaining({
                    context: expect.objectContaining({
                        triggerReason: 'cumulative_high',
                    }),
                })
            );
        });
    });
});
