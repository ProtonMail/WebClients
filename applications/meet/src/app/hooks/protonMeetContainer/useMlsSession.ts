import { type MutableRefObject, useRef } from 'react';

import { MeetCoreErrorEnum, MlsSyncStateInfo, RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setMlsRetrying } from '@proton/meet/store/slices/connectionSlice';
import { setMlsGroupState } from '@proton/meet/store/slices/meetingInfo';
import type { MLSGroupState } from '@proton/meet/types/types';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { setupLiveKitAdminChangeEvent, setupWasmDependencies } from '../../utils/wasmUtils';
import { useNotifyError } from '../useNotifyError';

interface UseMlsSessionParams {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
    updateAdminParticipant: (roomId: string, participantUid: string, participantType: Number) => Promise<void>;
    allowHealthCheck: () => void;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
    currentKeyRef: MutableRefObject<string | null>;
    mlsGroupStateRef: MutableRefObject<MLSGroupState | null>;
}

export interface UseMlsSessionResult {
    mlsSetupDone: MutableRefObject<boolean>;
    handleMlsSetup: (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        isWaitingRoom?: boolean
    ) => Promise<{ key: string; epoch: bigint } | undefined>;
}

export const useMlsSession = ({
    getGroupKeyInfo,
    onNewGroupKeyInfo,
    updateAdminParticipant,
    allowHealthCheck,
    triggerFullReconnectionRef,
    currentKeyRef,
    mlsGroupStateRef,
}: UseMlsSessionParams): UseMlsSessionResult => {
    const meetCoreClient = useMeetCoreClient();

    const { reportMeetError } = useMeetErrorReporting();

    const authentication = useAuthentication();
    const dispatch = useMeetDispatch();
    const notifyError = useNotifyError();

    const mlsSetupDone = useRef(false);

    const handleMlsSetup = async (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        isWaitingRoom = false
    ): Promise<{ key: string; epoch: bigint } | undefined> => {
        if (!mlsSetupDone.current) {
            mlsSetupDone.current = true;

            setupWasmDependencies({
                getGroupKeyInfo,
                onNewGroupKeyInfo,
                onMlsSyncStateChanged: (state: number) => {
                    if (state === MlsSyncStateInfo.Retrying) {
                        dispatch(setMlsRetrying(true));
                    } else if (state === MlsSyncStateInfo.Failed) {
                        dispatch(setMlsRetrying(false));
                        triggerFullReconnectionRef.current(RejoinReasonInfo.EpochMismatch);
                    } else if (state === MlsSyncStateInfo.Success) {
                        dispatch(setMlsRetrying(false));
                    }
                },
            });
            setupLiveKitAdminChangeEvent({ onLiveKitAdminChanged: updateAdminParticipant });
        }

        try {
            const sessionId = authentication.hasSession() ? authentication.getUID() : null;
            await meetCoreClient.joinMeetingWithAccessTokenWithSwitchJoinType(
                accessToken,
                meetingLinkName,
                meetingPassword,
                sessionId,
                true,
                isWaitingRoom
            );

            await meetCoreClient.setMlsGroupUpdateHandler();
            await meetCoreClient.setLiveKitAdminChangeHandler();
            await meetCoreClient.setMlsSyncStateUpdateHandler();

            if (isWaitingRoom) {
                try {
                    await meetCoreClient.setJoinRequestHandler();
                } catch (error) {
                    reportMeetError('Failed to set waiting room join request handler', {
                        context: { error },
                        tags: { meetingLinkName },
                    });
                }
            }

            const groupKeyData = await meetCoreClient.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            const displayCode = await meetCoreClient.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(groupKeyData.epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;

            allowHealthCheck();

            return groupKeyData;
        } catch (error) {
            let message: string;
            switch (error) {
                case MeetCoreErrorEnum.MlsServerVersionNotSupported:
                    message = c('Error')
                        .t`This meeting is on an older version, the host must end it and refresh Meet to restart with the latest version.`;
                    break;
                case MeetCoreErrorEnum.CheckDeviceClock:
                    message = c('Error')
                        .t`Your device's clock appears to be out of sync. Please check your system time and try again.`;
                    break;
                case MeetCoreErrorEnum.MaxRetriesReached:
                case MeetCoreErrorEnum.HttpClientError:
                default:
                    // eslint-disable-next-line no-console
                    console.error(error);
                    message = c('Error').t`Failed to join meeting. Please try again later.`;
            }
            notifyError(message);
            const err = new Error(message);
            Object.assign(err, { userNotified: true });
            throw err;
        }
    };

    return { mlsSetupDone, handleMlsSetup };
};
