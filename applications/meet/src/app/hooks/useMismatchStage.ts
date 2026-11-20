import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantCountMismatchSince } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

const MISMATCH_INFO_DELAY = 30 * SECOND;
export const MISMATCH_WARNING_DELAY = MINUTE;

export enum MismatchStage {
    Hidden = 0,
    Info = 1,
    Warning = 2,
}

const getMismatchStage = (elapsed: number): MismatchStage => {
    if (elapsed >= MISMATCH_WARNING_DELAY) {
        return MismatchStage.Warning;
    }

    if (elapsed >= MISMATCH_INFO_DELAY) {
        return MismatchStage.Info;
    }

    return MismatchStage.Hidden;
};

/**
 * The start of the mismatch lives in the store because the details sidebar unmounts whenever it is
 * closed, which would otherwise restart the clock. Only the remaining time is timed locally.
 */
export const useMismatchStage = (): MismatchStage => {
    const isParticipantCountMismatchEnabled = useFlag('MeetParticipantCountMismatch');
    const isGuest = useMeetSelector(selectIsGuest);
    const mismatchSince = useMeetSelector(selectParticipantCountMismatchSince);
    const trackedMismatchSince = isParticipantCountMismatchEnabled && !isGuest ? mismatchSince : null;
    const [stage, setStage] = useState(() =>
        trackedMismatchSince === null ? MismatchStage.Hidden : getMismatchStage(Date.now() - trackedMismatchSince)
    );

    useEffect(() => {
        if (trackedMismatchSince === null) {
            setStage(MismatchStage.Hidden);
            return;
        }

        const elapsed = Date.now() - trackedMismatchSince;
        setStage(getMismatchStage(elapsed));

        const timeouts = [MISMATCH_INFO_DELAY, MISMATCH_WARNING_DELAY]
            .filter((delay) => delay > elapsed)
            .map((delay) => setTimeout(() => setStage(getMismatchStage(delay)), delay - elapsed));

        return () => timeouts.forEach(clearTimeout);
    }, [trackedMismatchSince]);

    return stage;
};
