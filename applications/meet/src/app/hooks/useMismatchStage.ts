import { useEffect, useReducer } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import type { ParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import { selectParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

const MISMATCH_INFO_DELAY = 30 * SECOND;
const MISMATCH_WARNING_DELAY = MINUTE;

export enum MismatchStage {
    Hidden = 0,
    Info = 1,
    Warning = 2,
    HostAway = 3,
}

const getStageDelays = (isHostInCall: boolean): { delay: number; stage: MismatchStage }[] =>
    isHostInCall
        ? [
              { delay: MISMATCH_WARNING_DELAY, stage: MismatchStage.Warning },
              { delay: MISMATCH_INFO_DELAY, stage: MismatchStage.Info },
          ]
        : [{ delay: MISMATCH_INFO_DELAY, stage: MismatchStage.HostAway }];

const getMismatchStage = ({ since, isHostInCall }: ParticipantCountMismatch): MismatchStage => {
    const elapsed = Date.now() - since;

    return getStageDelays(isHostInCall).find(({ delay }) => elapsed >= delay)?.stage ?? MismatchStage.Hidden;
};

/**
 * The start of the mismatch lives in the store because the details sidebar unmounts whenever it is
 * closed, which would otherwise restart the clock. Only the remaining time is timed locally.
 */
export const useMismatchStage = (): MismatchStage => {
    const isParticipantCountMismatchEnabled = useFlag('MeetParticipantCountMismatch');
    const isGuest = useMeetSelector(selectIsGuest);
    const mismatch = useMeetSelector(selectParticipantCountMismatch);
    const trackedMismatch = isParticipantCountMismatchEnabled && !isGuest ? mismatch : null;
    const [tick, rerender] = useReducer((previousTick: number) => previousTick + 1, 0);
    const stage = trackedMismatch === null ? MismatchStage.Hidden : getMismatchStage(trackedMismatch);

    useEffect(() => {
        if (trackedMismatch === null) {
            return;
        }

        const elapsed = Date.now() - trackedMismatch.since;
        const timeouts = getStageDelays(trackedMismatch.isHostInCall)
            .filter(({ delay }) => delay > elapsed)
            .map(({ delay }) => setTimeout(rerender, delay - elapsed));

        return () => timeouts.forEach(clearTimeout);
    }, [trackedMismatch, tick]);

    return stage;
};
