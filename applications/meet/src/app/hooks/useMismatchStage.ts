import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantCountMismatchSince } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

const MISMATCH_INFO_DELAY = 30 * SECOND;
const MISMATCH_WARNING_DELAY = MINUTE;

export enum MismatchStage {
    Hidden = 0,
    Info = 1,
    Warning = 2,
}

/**
 * The start of the mismatch lives in the store because the details sidebar unmounts whenever it is
 * closed, which would otherwise restart the clock. Only the remaining time is timed locally.
 */
export const useMismatchStage = (): MismatchStage => {
    const isParticipantCountMismatchEnabled = useFlag('MeetParticipantCountMismatch');
    const isGuest = useMeetSelector(selectIsGuest);
    const mismatchSince = useMeetSelector(selectParticipantCountMismatchSince);
    const [stage, setStage] = useState<MismatchStage>(MismatchStage.Hidden);

    useEffect(() => {
        if (!isParticipantCountMismatchEnabled || isGuest || mismatchSince === null) {
            setStage(MismatchStage.Hidden);
            return;
        }

        const elapsed = Date.now() - mismatchSince;

        if (elapsed >= MISMATCH_WARNING_DELAY) {
            setStage(MismatchStage.Warning);
            return;
        }

        const warningTimeout = setTimeout(() => setStage(MismatchStage.Warning), MISMATCH_WARNING_DELAY - elapsed);

        if (elapsed >= MISMATCH_INFO_DELAY) {
            setStage(MismatchStage.Info);
            return () => clearTimeout(warningTimeout);
        }

        setStage(MismatchStage.Hidden);

        const infoTimeout = setTimeout(() => setStage(MismatchStage.Info), MISMATCH_INFO_DELAY - elapsed);

        return () => {
            clearTimeout(infoTimeout);
            clearTimeout(warningTimeout);
        };
    }, [isParticipantCountMismatchEnabled, isGuest, mismatchSince]);

    return stage;
};
