import { mergeParticipantsMap } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetState } from '@proton/meet/store/store';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';

import { initMeetEventSim } from './meetEventSim';

const LOCAL_IDENTITY = 'local-participant';

const localParticipant = {
    ParticipantUUID: LOCAL_IDENTITY,
    EncryptedDisplayName: 'encrypted-name',
    IsAdmin: ParticipantCapabilityPermission.Allowed,
    IsHost: ParticipantCapabilityPermission.NotAllowed,
};

const getStateWith = (participantsMap: Record<string, typeof localParticipant>) => () =>
    ({ participants: { localParticipantIdentity: LOCAL_IDENTITY, participantsMap } }) as unknown as MeetState;

describe('meetEventSim.setLocalParticipantHost', () => {
    let cleanup: () => void;

    afterEach(() => {
        cleanup?.();
    });

    it('marks only the local participant as host and keeps its other fields', () => {
        const dispatch = vi.fn();
        cleanup = initMeetEventSim(dispatch, vi.fn(), getStateWith({ [LOCAL_IDENTITY]: localParticipant }));

        expect(window.meetEventSim?.setLocalParticipantHost()).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            mergeParticipantsMap({
                [LOCAL_IDENTITY]: { ...localParticipant, IsHost: ParticipantCapabilityPermission.Allowed },
            })
        );
    });

    it('removes the host flag when called with false', () => {
        const dispatch = vi.fn();
        const host = { ...localParticipant, IsHost: ParticipantCapabilityPermission.Allowed };
        cleanup = initMeetEventSim(dispatch, vi.fn(), getStateWith({ [LOCAL_IDENTITY]: host }));

        expect(window.meetEventSim?.setLocalParticipantHost(false)).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            mergeParticipantsMap({
                [LOCAL_IDENTITY]: { ...host, IsHost: ParticipantCapabilityPermission.NotAllowed },
            })
        );
    });

    it('does nothing when the local participant is not in the participant list yet', () => {
        const dispatch = vi.fn();
        cleanup = initMeetEventSim(dispatch, vi.fn(), getStateWith({}));

        expect(window.meetEventSim?.setLocalParticipantHost()).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    });
});
