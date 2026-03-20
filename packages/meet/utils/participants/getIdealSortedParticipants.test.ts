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
        const local = createMockLocal('local');
        const remote1 = createMockRemote('remote-1');
        const remote2 = createMockRemote('remote-2');

        const result = getIdealSortedParticipants({
            participants: [remote1, remote2, local],
            raisedHandsSet: new Set(),
        });

        expect(result[0]).toBe('local');
    });

    it('should place active speakers before non-speakers', () => {
        const local = createMockLocal('local');
        const silent = createMockRemote('silent');
        const speaker = createMockRemote('speaker', { isSpeaking: true, audioLevel: 0.5 });

        const result = getIdealSortedParticipants({
            participants: [local, silent, speaker],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'speaker', 'silent']);
    });

    it('should sort multiple active speakers by audio level (highest first)', () => {
        const local = createMockLocal('local');
        const loudSpeaker = createMockRemote('loud', { isSpeaking: true, audioLevel: 0.9 });
        const quietSpeaker = createMockRemote('quiet', { isSpeaking: true, audioLevel: 0.3 });

        const result = getIdealSortedParticipants({
            participants: [local, quietSpeaker, loudSpeaker],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'loud', 'quiet']);
    });

    it('should sort by lastSpokeAt when no one is currently speaking (most recent first)', () => {
        const local = createMockLocal('local');
        const spokeRecently = createMockRemote('recent', { lastSpokeAt: new Date('2026-03-11T12:00:00') });
        const spokeEarlier = createMockRemote('earlier', { lastSpokeAt: new Date('2026-03-11T11:00:00') });
        const neverSpoke = createMockRemote('never');

        const result = getIdealSortedParticipants({
            participants: [local, neverSpoke, spokeEarlier, spokeRecently],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'recent', 'earlier', 'never']);
    });

    it('should sort by camera enabled when speaking history is the same', () => {
        const local = createMockLocal('local');
        const cameraOn = createMockRemote('cam-on', { isCameraEnabled: true });
        const cameraOff = createMockRemote('cam-off', { isCameraEnabled: false });

        const result = getIdealSortedParticipants({
            participants: [local, cameraOff, cameraOn],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'cam-on', 'cam-off']);
    });

    it('should sort by join time as last tiebreaker (earliest first)', () => {
        const local = createMockLocal('local');
        const joinedFirst = createMockRemote('first', { joinedAt: new Date('2026-03-11T10:00:00') });
        const joinedSecond = createMockRemote('second', { joinedAt: new Date('2026-03-11T11:00:00') });

        const result = getIdealSortedParticipants({
            participants: [local, joinedSecond, joinedFirst],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'first', 'second']);
    });

    it('should apply the full priority chain correctly', () => {
        const local = createMockLocal('local');
        const activeSpeaker = createMockRemote('active', { isSpeaking: true, audioLevel: 0.8 });
        const recentlySpokeWithCam = createMockRemote('recent-cam', {
            lastSpokeAt: new Date('2026-03-11T12:00:00'),
            isCameraEnabled: true,
        });
        const cameraOnly = createMockRemote('cam-only', { isCameraEnabled: true });
        const idle = createMockRemote('idle', { joinedAt: new Date('2026-03-11T10:00:00') });

        const result = getIdealSortedParticipants({
            participants: [idle, cameraOnly, local, recentlySpokeWithCam, activeSpeaker],
            raisedHandsSet: new Set(),
        });

        expect(result[0]).toBe('local');
        expect(result[1]).toBe('active');
        expect(result[2]).toBe('recent-cam');
    });

    it('should handle an empty participants list', () => {
        const result = getIdealSortedParticipants({ participants: [], raisedHandsSet: new Set() });

        expect(result).toEqual([]);
    });

    it('should handle a single local participant', () => {
        const local = createMockLocal('local');

        const result = getIdealSortedParticipants({ participants: [local], raisedHandsSet: new Set() });

        expect(result).toEqual(['local']);
    });

    it('should return identities as strings', () => {
        const local = createMockLocal('local');
        const remote = createMockRemote('remote-1');

        const result = getIdealSortedParticipants({ participants: [local, remote], raisedHandsSet: new Set() });

        result.forEach((id) => expect(typeof id).toBe('string'));
    });

    it('should preserve insertion order for fully tied remote participants', () => {
        const local = createMockLocal('local');
        const remote1 = createMockRemote('remote-1');
        const remote2 = createMockRemote('remote-2');
        const remote3 = createMockRemote('remote-3');

        const result = getIdealSortedParticipants({
            participants: [local, remote1, remote2, remote3],
            raisedHandsSet: new Set(),
        });

        expect(result).toEqual(['local', 'remote-1', 'remote-2', 'remote-3']);
    });
});
