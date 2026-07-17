import { describe, expect, it } from 'vitest';

import { shouldShowParticipantVideo } from './shouldShowParticipantVideo';

describe('shouldShowParticipantVideo', () => {
    it('hides the local self-view while suppressed (camera-off join init window)', () => {
        expect(
            shouldShowParticipantVideo({
                cameraIsOn: true,
                isLocalParticipant: true,
                isLocalVideoSuppressed: true,
                isVideoDisabled: false,
            })
        ).toBe(false);
    });

    it('shows the local self-view once no longer suppressed', () => {
        expect(
            shouldShowParticipantVideo({
                cameraIsOn: true,
                isLocalParticipant: true,
                isLocalVideoSuppressed: false,
                isVideoDisabled: false,
            })
        ).toBe(true);
    });

    it('never shows video when the camera is off', () => {
        expect(
            shouldShowParticipantVideo({
                cameraIsOn: false,
                isLocalParticipant: true,
                isLocalVideoSuppressed: false,
                isVideoDisabled: false,
            })
        ).toBe(false);
    });

    it('does not suppress remote participants', () => {
        expect(
            shouldShowParticipantVideo({
                cameraIsOn: true,
                isLocalParticipant: false,
                isLocalVideoSuppressed: true,
                isVideoDisabled: false,
            })
        ).toBe(true);
    });

    it('hides remote video when video is disabled, but keeps the local self-view', () => {
        expect(
            shouldShowParticipantVideo({
                cameraIsOn: true,
                isLocalParticipant: false,
                isLocalVideoSuppressed: false,
                isVideoDisabled: true,
            })
        ).toBe(false);

        expect(
            shouldShowParticipantVideo({
                cameraIsOn: true,
                isLocalParticipant: true,
                isLocalVideoSuppressed: false,
                isVideoDisabled: true,
            })
        ).toBe(true);
    });
});
