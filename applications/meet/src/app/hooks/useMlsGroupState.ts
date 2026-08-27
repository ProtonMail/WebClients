import { type MutableRefObject, useRef } from 'react';

import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setMlsGroupState } from '@proton/meet/store/slices/currentMeeting';
import type { MLSGroupState } from '@proton/meet/types/types';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';

export interface UseMlsGroupStateResult {
    mlsGroupStateRef: MutableRefObject<MLSGroupState | null>;
    refreshMlsGroupState: (epoch: bigint) => Promise<void>;
}

export const useMlsGroupState = (): UseMlsGroupStateResult => {
    const dispatch = useMeetDispatch();
    const meetCoreClient = useMeetCoreClient();
    const { reportMeetError } = useMeetErrorReporting();

    const mlsGroupStateRef = useRef<MLSGroupState | null>(null);

    const refreshMlsGroupState = async (epoch: bigint) => {
        const displayCode = await meetCoreClient.getGroupDisplayCode();
        const memberCount = await meetCoreClient.getGroupLen().catch((error) => {
            reportMeetError('Error while calling meetCoreClient.getGroupLen', { context: { error } });
            return null;
        });

        const nextMlsGroupState = {
            displayCode: displayCode?.full_code || null,
            epoch: Number(epoch),
            memberCount,
        };

        dispatch(setMlsGroupState(nextMlsGroupState));
        mlsGroupStateRef.current = nextMlsGroupState;
    };

    return { mlsGroupStateRef, refreshMlsGroupState };
};
