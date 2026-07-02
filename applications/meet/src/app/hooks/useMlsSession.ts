import { type Dispatch, type MutableRefObject, type SetStateAction, useRef } from 'react';

import { JoinTypeInfo, MeetCoreErrorEnum, MlsSyncStateInfo, RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setMlsGroupState } from '@proton/meet/store/slices/meetingInfo';
import type { MLSGroupState } from '@proton/meet/types/types';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';
import { setupLiveKitAdminChangeEvent, setupWasmDependencies } from '../utils/wasmUtils';

interface UseMlsSessionParams {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
    updateAdminParticipant: (roomId: string, participantUid: string, participantType: Number) => Promise<void>;
    allowHealthCheck: () => void;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
    setMlsRetrying: Dispatch<SetStateAction<boolean>>;
    currentKeyRef: MutableRefObject<string | null>;
    mlsGroupStateRef: MutableRefObject<MLSGroupState | null>;
}

export interface UseMlsSessionResult {
    mlsSetupDone: MutableRefObject<boolean>;
    handleMlsSetup: (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        participantsCountValue?: number | null
    ) => Promise<{ key: string; epoch: bigint } | undefined>;
}

export const useMlsSession = ({
    getGroupKeyInfo,
    onNewGroupKeyInfo,
    updateAdminParticipant,
    allowHealthCheck,
    triggerFullReconnectionRef,
    setMlsRetrying,
    currentKeyRef,
    mlsGroupStateRef,
}: UseMlsSessionParams): UseMlsSessionResult => {
    const isMeetNewJoinTypeEnabled = useFlag('MeetNewJoinType');
    const isMeetSwitchJoinTypeEnabled = useFlag('MeetSwitchJoinType');
    const isMeetNewSwitchJoinTypeEnabled = useFlag('MeetNewSwitchJoinType');

    const meetCoreClient = useMeetCoreClient();

    const authentication = useAuthentication();
    const dispatch = useMeetDispatch();
    const { createNotification } = useNotifications();

    const mlsSetupDone = useRef(false);

    const handleMlsSetup = async (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        participantsCountValue?: number | null
    ): Promise<{ key: string; epoch: bigint } | undefined> => {
        if (!mlsSetupDone.current) {
            mlsSetupDone.current = true;

            setupWasmDependencies({
                getGroupKeyInfo,
                onNewGroupKeyInfo,
                onMlsSyncStateChanged: (state: number) => {
                    if (state === MlsSyncStateInfo.Retrying) {
                        setMlsRetrying(true);
                    } else if (state === MlsSyncStateInfo.Failed) {
                        setMlsRetrying(false);
                        triggerFullReconnectionRef.current(RejoinReasonInfo.EpochMismatch);
                    } else if (state === MlsSyncStateInfo.Success) {
                        setMlsRetrying(false);
                    }
                },
            });
            setupLiveKitAdminChangeEvent({ onLiveKitAdminChanged: updateAdminParticipant });
        }

        try {
            const sessionId = authentication.hasSession() ? authentication.getUID() : null;
            if (isMeetNewSwitchJoinTypeEnabled) {
                await meetCoreClient.joinMeetingWithAccessTokenWithSwitchJoinType(
                    accessToken,
                    meetingLinkName,
                    meetingPassword,
                    sessionId,
                    isMeetSwitchJoinTypeEnabled
                );
            } else {
                const joinType = await meetCoreClient.getJoinType(
                    isMeetNewJoinTypeEnabled,
                    isMeetSwitchJoinTypeEnabled,
                    participantsCountValue ?? 0
                );
                if (joinType === JoinTypeInfo.ExternalProposal) {
                    // eslint-disable-next-line no-console
                    console.log('Joining room with proposal');
                    try {
                        await meetCoreClient.joinRoomWithProposal(
                            accessToken,
                            meetingLinkName,
                            meetingPassword,
                            sessionId
                        );
                    } catch (error) {
                        // fallback to join with external commit
                        await meetCoreClient.joinMeetingWithAccessToken(
                            accessToken,
                            meetingLinkName,
                            meetingPassword,
                            sessionId
                        );
                    }
                } else {
                    await meetCoreClient.joinMeetingWithAccessToken(
                        accessToken,
                        meetingLinkName,
                        meetingPassword,
                        sessionId
                    );
                }
            }

            await meetCoreClient.setMlsGroupUpdateHandler();
            await meetCoreClient.setLiveKitAdminChangeHandler();
            await meetCoreClient.setMlsSyncStateUpdateHandler();

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
                case MeetCoreErrorEnum.TimeDriftError:
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
            createNotification({ type: 'error', text: message });
            const err = new Error(message);
            Object.assign(err, { userNotified: true });
            throw err;
        }
    };

    return { mlsSetupDone, handleMlsSetup };
};
