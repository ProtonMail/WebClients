import { describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import {
    selectIsLocalScreenShare,
    selectIsParticipantScreenSharing,
    selectIsScreenShare,
} from './screenShareStatusSlice';

const createMockState = (
    overrides: {
        participantScreenSharingIdentity?: string | null;
        localParticipantIdentity?: string;
    } = {}
): MeetState =>
    ({
        screenShareStatus: {
            participantScreenSharingIdentity: overrides.participantScreenSharingIdentity ?? null,
        },
        sortedParticipants: {
            localParticipantIdentity: overrides.localParticipantIdentity ?? 'local',
        },
    }) as unknown as MeetState;

describe('screenShareStatusSlice', () => {
    describe('selectors', () => {
        describe('selectIsScreenShare', () => {
            it('should return false when no one is screen sharing', () => {
                const state = createMockState({ participantScreenSharingIdentity: null });

                expect(selectIsScreenShare(state)).toBe(false);
            });

            it('should return true when a remote participant is screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: 'remote-1',
                    localParticipantIdentity: 'local',
                });

                expect(selectIsScreenShare(state)).toBe(true);
            });

            it('should return true when the local participant is screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: 'local',
                    localParticipantIdentity: 'local',
                });

                expect(selectIsScreenShare(state)).toBe(true);
            });

            it('should return false when the identity is an empty string', () => {
                const state = createMockState({ participantScreenSharingIdentity: '' });

                expect(selectIsScreenShare(state)).toBe(false);
            });
        });

        describe('selectIsLocalScreenShare', () => {
            it('should return false when no one is screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: null,
                    localParticipantIdentity: 'local',
                });

                expect(selectIsLocalScreenShare(state)).toBe(false);
            });

            it('should return false when a remote participant is screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: 'remote-1',
                    localParticipantIdentity: 'local',
                });

                expect(selectIsLocalScreenShare(state)).toBe(false);
            });

            it('should return true when the local participant is screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: 'local',
                    localParticipantIdentity: 'local',
                });

                expect(selectIsLocalScreenShare(state)).toBe(true);
            });

            it('should return false when both identities are null', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: null,
                    localParticipantIdentity: undefined,
                });

                expect(selectIsLocalScreenShare(state)).toBe(false);
            });
        });

        describe('selectIsParticipantScreenSharing', () => {
            it('should return false when no one is screen sharing', () => {
                const state = createMockState({ participantScreenSharingIdentity: null });

                expect(selectIsParticipantScreenSharing(state, 'remote-1')).toBe(false);
            });

            it('should return true when the given participant is the one screen sharing', () => {
                const state = createMockState({ participantScreenSharingIdentity: 'remote-1' });

                expect(selectIsParticipantScreenSharing(state, 'remote-1')).toBe(true);
            });

            it('should return false when a different participant is screen sharing', () => {
                const state = createMockState({ participantScreenSharingIdentity: 'remote-1' });

                expect(selectIsParticipantScreenSharing(state, 'remote-2')).toBe(false);
            });

            it('should return true when the local participant is the one screen sharing', () => {
                const state = createMockState({
                    participantScreenSharingIdentity: 'local',
                    localParticipantIdentity: 'local',
                });

                expect(selectIsParticipantScreenSharing(state, 'local')).toBe(true);
            });

            it('should return false when called with an empty identity and no one is screen sharing', () => {
                const state = createMockState({ participantScreenSharingIdentity: null });

                expect(selectIsParticipantScreenSharing(state, '')).toBe(false);
            });
        });
    });
});
