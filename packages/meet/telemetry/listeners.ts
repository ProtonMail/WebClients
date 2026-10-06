import { isAnyOf } from '@reduxjs/toolkit';

import { showPermissionsModal } from '../store/slices/deviceManagementSlice';
import { selectPermissionsModals } from '../store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '../store/slices/deviceManagementSlice/types';
import {
    ParticipantsLayouts,
    SpotlightSources,
    setParticipantsLayout,
    setSpotlightSource,
} from '../store/slices/layoutSlice';
import { setParticipantScreenShare } from '../store/slices/screenShareStatusSlice';
import { selectMeetSettings, selectSelfView, setDisableVideos, setSelfView } from '../store/slices/settings';
import {
    MeetingSideBars,
    PermissionPromptStatus,
    openChatAtMessage,
    openSideBar,
    openWaitingRoomSideBar,
    selectNoDeviceDetected,
    selectSideBarState,
    setNoDeviceDetected,
    toggleSideBarState,
} from '../store/slices/uiStateSlice';
import type { MeetAppStartListening, MeetState } from '../store/store';
import { toToggleState } from './dimensions';
import type { LayoutDimension, PermissionKind } from './events';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from './meetTelemetry';

const BLOCKED_PERMISSION_KINDS: Partial<Record<PermissionsModalType, PermissionKind[]>> = {
    [PermissionsModalType.PERMISSIONS_BLOCKED_MODAL]: ['camera', 'microphone'],
    [PermissionsModalType.PERMISSIONS_BLOCKED_CAMERA_MODAL]: ['camera'],
    [PermissionsModalType.PERMISSIONS_BLOCKED_MICROPHONE_MODAL]: ['microphone'],
    [PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL]: ['screen'],
};

const getLayoutDimension = (state: MeetState): LayoutDimension => {
    if (state.layout.participantsLayout === ParticipantsLayouts.Gallery) {
        return 'gallery';
    }
    return state.layout.spotlightSource === SpotlightSources.ScreenShare ? 'screen_share' : 'speaker';
};

/** settings_opened is sent by the buttons, as only they know whether it is the toolbar or the more menu. */
const sendSideBarToggledEvent = (sideBar: MeetingSideBars, isOpen: boolean) => {
    const state = toToggleState(isOpen);

    switch (sideBar) {
        case MeetingSideBars.Participants:
            sendMeetActionsEvent(TelemetryMeetActionsEvents.participant_list_toggled, { state });
            break;
        case MeetingSideBars.Chat:
            sendMeetActionsEvent(TelemetryMeetActionsEvents.chat_toggled, { state });
            break;
        case MeetingSideBars.MeetingDetails:
            if (isOpen) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.meeting_details_opened);
            }
            break;
    }
};

/** Events that are a state change of the store, whichever component dispatched it. */
export const startMeetTelemetryListeners = (startListening: MeetAppStartListening) => {
    // Opening a sidebar closes the others. resetUiState is left out, closing them on leave is not a user action.
    startListening({
        matcher: isAnyOf(toggleSideBarState, openSideBar, openChatAtMessage, openWaitingRoomSideBar),
        effect: (action, { getState, getOriginalState }) => {
            const before = selectSideBarState(getOriginalState());
            const after = selectSideBarState(getState());

            (Object.keys(after) as MeetingSideBars[])
                .filter((sideBar) => before[sideBar] !== after[sideBar])
                .forEach((sideBar) => sendSideBarToggledEvent(sideBar, after[sideBar]));

            if (openChatAtMessage.match(action)) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.chat_scrolled_to_message, { source: 'snackbar' });
            }
        },
    });

    startListening({
        matcher: isAnyOf(setParticipantsLayout, setSpotlightSource, setParticipantScreenShare),
        effect: (action, { getState, getOriginalState }) => {
            const fromLayout = getLayoutDimension(getOriginalState());
            const toLayout = getLayoutDimension(getState());

            if (fromLayout !== toLayout) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.layout_changed, {
                    fromLayout,
                    toLayout,
                    trigger: setParticipantScreenShare.match(action) ? 'auto_screen_share' : 'manual',
                });
            }
        },
    });

    startListening({
        actionCreator: showPermissionsModal,
        effect: ({ payload }, { getOriginalState }) => {
            if (selectPermissionsModals(getOriginalState()).permissionsModal === payload.modal) {
                return;
            }

            BLOCKED_PERMISSION_KINDS[payload.modal]?.forEach((permissionKind) =>
                sendMeetActionsEvent(TelemetryMeetActionsEvents.permission_blocked_modal_shown, { permissionKind })
            );
        },
    });

    startListening({
        actionCreator: setNoDeviceDetected,
        effect: ({ payload }, { getOriginalState }) => {
            if (payload === PermissionPromptStatus.CLOSED || payload === selectNoDeviceDetected(getOriginalState())) {
                return;
            }

            sendMeetActionsEvent(TelemetryMeetActionsEvents.no_device_detected, {
                deviceKind: payload === PermissionPromptStatus.CAMERA ? 'videoinput' : 'audioinput',
            });
        },
    });

    startListening({
        actionCreator: setSelfView,
        effect: ({ payload }, { getOriginalState }) => {
            if (payload !== selectSelfView(getOriginalState())) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.self_view_toggled, { state: toToggleState(payload) });
            }
        },
    });

    startListening({
        actionCreator: setDisableVideos,
        effect: ({ payload }, { getOriginalState }) => {
            if (payload !== selectMeetSettings(getOriginalState()).disableVideos) {
                sendMeetActionsEvent(TelemetryMeetActionsEvents.incoming_video_toggled, {
                    state: toToggleState(!payload),
                });
            }
        },
    });
};
