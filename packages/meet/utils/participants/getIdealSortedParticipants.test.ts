import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { describe, expect, it } from 'vitest';

import { getIdealSortedParticipants } from './getIdealSortedParticipants';

const createMockLocal = (identity: string, overrides: Partial<LocalParticipant> = {}): LocalParticipant =>
    ({
        identity,
        isLocal: true,
        isSpeaking: false,
        audioLevel: 0,
        lastSpokeAt: undefined,
        isCameraEnabled: false,
        joinedAt: undefined,
        ...overrides,
    }) as unknown as LocalParticipant;

const createMockRemote = (identity: string, overrides: Partial<RemoteParticipant> = {}): RemoteParticipant =>
    ({
        identity,
        isLocal: false,
        isSpeaking: false,
        audioLevel: 0,
        lastSpokeAt: undefined,
        isCameraEnabled: false,
        joinedAt: undefined,
        ...overrides,
    }) as unknown as RemoteParticipant;

describe('getIdealSortedParticipants', () => {
    it('should have the local participant as the first participant', () => {
        const local = createMockLocal('local-user');
        const remote1 = createMockRemote('remote-1');
        const remote2 = createMockRemote('remote-2');

        const result = getIdealSortedParticipants([remote1, remote2, local]);

        expect(result[0]).toBe('local-user');
    });

    it('should place active speakers before non-speakers', () => {
        const local = createMockLocal('local-user');
        const silent = createMockRemote('silent');
        const speaker = createMockRemote('speaker', { isSpeaking: true, audioLevel: 0.5 });

        const result = getIdealSortedParticipants([local, silent, speaker]);

        expect(result).toEqual(['local-user', 'speaker', 'silent']);
    });

    it('should sort multiple active speakers by audio level (highest first)', () => {
        const local = createMockLocal('local-user');
        const loudSpeaker = createMockRemote('loud', { isSpeaking: true, audioLevel: 0.9 });
        const quietSpeaker = createMockRemote('quiet', { isSpeaking: true, audioLevel: 0.3 });

        const result = getIdealSortedParticipants([local, quietSpeaker, loudSpeaker]);

        expect(result).toEqual(['local-user', 'loud', 'quiet']);
    });

    it('should sort by lastSpokeAt when no one is currently speaking (most recent first)', () => {
        const local = createMockLocal('local-user');
        const spokeRecently = createMockRemote('recent', { lastSpokeAt: new Date('2026-03-11T12:00:00') });
        const spokeEarlier = createMockRemote('earlier', { lastSpokeAt: new Date('2026-03-11T11:00:00') });
        const neverSpoke = createMockRemote('never');

        const result = getIdealSortedParticipants([local, neverSpoke, spokeEarlier, spokeRecently]);

        expect(result).toEqual(['local-user', 'recent', 'earlier', 'never']);
    });

    it('should sort by camera enabled when speaking history is the same', () => {
        const local = createMockLocal('local-user');
        const cameraOn = createMockRemote('cam-on', { isCameraEnabled: true });
        const cameraOff = createMockRemote('cam-off', { isCameraEnabled: false });

        const result = getIdealSortedParticipants([local, cameraOff, cameraOn]);

        expect(result).toEqual(['local-user', 'cam-on', 'cam-off']);
    });

    it('should sort by join time as last tiebreaker (earliest first)', () => {
        const local = createMockLocal('local-user');
        const joinedFirst = createMockRemote('first', { joinedAt: new Date('2026-03-11T10:00:00') });
        const joinedSecond = createMockRemote('second', { joinedAt: new Date('2026-03-11T11:00:00') });

        const result = getIdealSortedParticipants([local, joinedSecond, joinedFirst]);

        expect(result).toEqual(['local-user', 'first', 'second']);
    });

    it('should apply the full priority chain correctly', () => {
        const local = createMockLocal('local-user');
        const activeSpeaker = createMockRemote('active', { isSpeaking: true, audioLevel: 0.8 });
        const recentlySpokeWithCam = createMockRemote('recent-cam', {
            lastSpokeAt: new Date('2026-03-11T12:00:00'),
            isCameraEnabled: true,
        });
        const cameraOnly = createMockRemote('cam-only', { isCameraEnabled: true });
        const idle = createMockRemote('idle', { joinedAt: new Date('2026-03-11T10:00:00') });

        const result = getIdealSortedParticipants([idle, cameraOnly, local, recentlySpokeWithCam, activeSpeaker]);

        expect(result[0]).toBe('local-user');
        expect(result[1]).toBe('active');
        expect(result[2]).toBe('recent-cam');
    });

    it('should handle an empty participants list', () => {
        const result = getIdealSortedParticipants([]);

        expect(result).toEqual([]);
    });

    it('should handle a single local participant', () => {
        const local = createMockLocal('local-user');

        const result = getIdealSortedParticipants([local]);

        expect(result).toEqual(['local-user']);
    });

    it('should return identities as strings', () => {
        const local = createMockLocal('local-user');
        const remote = createMockRemote('remote-1');

        const result = getIdealSortedParticipants([local, remote]);

        result.forEach((id) => expect(typeof id).toBe('string'));
    });

    it('should handle missing local participant gracefully via filter(Boolean)', () => {
        const remote1 = createMockRemote('remote-1', { isSpeaking: true, audioLevel: 0.5 });
        const remote2 = createMockRemote('remote-2');

        const result = getIdealSortedParticipants([remote1, remote2]);

        expect(result).toEqual(['remote-1', 'remote-2']);
    });

    it('should preserve insertion order for fully tied remote participants', () => {
        const local = createMockLocal('local-user');
        const remote1 = createMockRemote('remote-1');
        const remote2 = createMockRemote('remote-2');
        const remote3 = createMockRemote('remote-3');

        const result = getIdealSortedParticipants([local, remote1, remote2, remote3]);

        expect(result).toEqual(['local-user', 'remote-1', 'remote-2', 'remote-3']);
    });
});
