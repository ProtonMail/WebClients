import { type MutableRefObject, useRef, useState } from 'react';

import type { App, GroupKeyInfo } from '@proton-meet/proton-meet-core';

import type { useMeetDispatch } from '@proton/meet/store/hooks';
import { addKeyRotationLog, setMlsGroupState } from '@proton/meet/store/slices/meetingInfo';
import type { KeyRotationLog, MLSGroupState } from '@proton/meet/types/types';

import type { ProtonMeetKeyProvider } from '../utils/ProtonMeetKeyProvider';
import { KeyRotationScheduler } from '../utils/SeamlessKeyRotationScheduler';

interface UseKeyManagementParams {
    keyProvider: ProtonMeetKeyProvider;
    isMeetSeamlessKeyRotationEnabled: boolean;
    isMeetClientMetricsLogEnabled: boolean;
    wasmApp: App | null;
    dispatch: ReturnType<typeof useMeetDispatch>;
    reportMeetError: (msg: string, options?: unknown) => void;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
}

export interface UseKeyManagementResult {
    keyRotationScheduler: KeyRotationScheduler;
    currentKeyRef: MutableRefObject<string | null>;
    lastEpochRef: MutableRefObject<bigint | null>;
    mlsGroupStateRef: MutableRefObject<MLSGroupState | null>;
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
    hasEpochError: (epoch: bigint | undefined) => string | null;
    reportMLSRelatedError: (key: string | undefined, epoch: bigint | undefined) => void;
}

export const useKeyManagement = ({
    keyProvider,
    isMeetSeamlessKeyRotationEnabled,
    isMeetClientMetricsLogEnabled,
    wasmApp,
    dispatch,
    reportMeetError,
    withMeetingLinkNameTag,
}: UseKeyManagementParams): UseKeyManagementResult => {
    const [keyRotationScheduler] = useState(() => new KeyRotationScheduler(keyProvider));
    const currentKeyRef = useRef<string | null>(null);
    const lastEpochRef = useRef<bigint | null>(null);
    const mlsGroupStateRef = useRef<MLSGroupState | null>(null);

    const hasEpochError = (epoch: bigint | undefined) => {
        if (epoch && lastEpochRef.current && lastEpochRef.current > epoch) {
            return 'Lower epoch than last epoch';
        }
        if (epoch && lastEpochRef.current && lastEpochRef.current + 1n !== epoch) {
            return 'Epoch is not the next epoch';
        }
        return null;
    };

    const reportMLSRelatedError = (key: string | undefined, epoch: bigint | undefined) => {
        if (epoch && lastEpochRef.current && lastEpochRef.current > epoch) {
            reportMeetError('Lower epoch than last epoch', withMeetingLinkNameTag({ epoch }));
        }
        if (epoch && lastEpochRef.current && lastEpochRef.current + 1n !== epoch) {
            reportMeetError('Epoch is not the next epoch', withMeetingLinkNameTag({ epoch }));
        }
        if (!key) {
            reportMeetError('Key is undefined', withMeetingLinkNameTag({ epoch }));
        }
        if (!epoch) {
            reportMeetError('Epoch is undefined', withMeetingLinkNameTag({}));
        }
    };

    const getGroupKeyInfo = async (): Promise<{ key: string; epoch: bigint }> => {
        try {
            const newGroupKeyInfo = (await wasmApp?.getGroupKey()) as GroupKeyInfo;
            currentKeyRef.current = newGroupKeyInfo.key;
            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(newGroupKeyInfo.epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;
            return { key: newGroupKeyInfo.key, epoch: newGroupKeyInfo.epoch };
        } catch (err: any) {
            reportMeetError('Error while calling getGroupKeyInfo', withMeetingLinkNameTag(err));
            throw err;
        }
    };

    const onNewGroupKeyInfo = async (key: string, epoch: bigint): Promise<void> => {
        try {
            reportMLSRelatedError(key, epoch);
            if (isMeetSeamlessKeyRotationEnabled) {
                await keyRotationScheduler.schedule(key, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(key, epoch);
            }

            const displayCode = await wasmApp?.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;

            if (isMeetClientMetricsLogEnabled) {
                try {
                    await wasmApp?.tryLogDesignatedCommitter(Number(epoch));
                } catch (error) {
                    reportMeetError('Failed to log designated committer rank', withMeetingLinkNameTag(error));
                }
            }

            const errorMessage = hasEpochError(epoch);
            const newLog = {
                timestamp: Date.now(),
                epoch: Number(epoch),
                type: errorMessage ? 'error' : 'log',
                message: errorMessage ?? 'Key rotation successful',
            };
            dispatch(addKeyRotationLog(newLog as KeyRotationLog));

            lastEpochRef.current = epoch;
        } catch (err) {
            dispatch(
                addKeyRotationLog({
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'error',
                    message: 'Could not set new encryption key',
                })
            );
            reportMeetError('Could not set new encryption key', withMeetingLinkNameTag(err));
        }
    };

    return {
        keyRotationScheduler,
        currentKeyRef,
        lastEpochRef,
        mlsGroupStateRef,
        getGroupKeyInfo,
        onNewGroupKeyInfo,
        hasEpochError,
        reportMLSRelatedError,
    };
};
