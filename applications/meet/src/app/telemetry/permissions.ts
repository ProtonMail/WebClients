import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { PermissionBlockedError, requestPermission } from '@proton/meet/store/slices/deviceManagementSlice';
import type { MeetState } from '@proton/meet/store/store';
import type { PermissionOutcome } from '@proton/meet/telemetry/events';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

const toPermissionOutcome = (state: PermissionState): PermissionOutcome => {
    if (state === 'granted') {
        return 'granted';
    }
    // A dismissed prompt leaves the permission in the prompt state
    return state === 'prompt' ? 'dismissed' : 'denied';
};

/** Same as `requestPermission`, and reports the answer when the browser prompt could have been shown. */
export const requestPermissionWithTelemetry =
    (
        deviceType: 'camera' | 'microphone',
        deviceId?: string
    ): ThunkAction<Promise<PermissionState>, MeetState, ProtonThunkArguments, UnknownAction> =>
    async (dispatch, getState) => {
        const wasGranted = getState().deviceManagement.permissions[deviceType] === 'granted';

        const sendTelemetry = (outcome: PermissionOutcome) => {
            if (!wasGranted) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.permission_requested, {
                    permissionKind: deviceType,
                    outcome,
                });
            }
        };

        try {
            const { state, isPermissionAnswer } = await dispatch(requestPermission(deviceType, deviceId));

            if (isPermissionAnswer) {
                sendTelemetry(toPermissionOutcome(state));
            }

            return state;
        } catch (error) {
            if (error instanceof PermissionBlockedError) {
                sendTelemetry('denied');
            }
            throw error;
        }
    };
