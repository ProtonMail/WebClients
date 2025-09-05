import { createContext, useCallback, useContext, useState } from 'react';

import { MeetingSideBars, PermissionPromptStatus, PopUpControls } from '../types';

export interface UIStateContextType {
    meetingReadyPopupOpen: boolean;
    setMeetingReadyPopupOpen: (meetingReadyPopupOpen: boolean) => void;
    sideBarState: {
        [MeetingSideBars.Participants]: boolean;
        [MeetingSideBars.Settings]: boolean;
        [MeetingSideBars.Chat]: boolean;
        [MeetingSideBars.MeetingDetails]: boolean;
    };
    toggleSideBarState: (sideBarState: MeetingSideBars) => void;
    popupState: {
        [PopUpControls.Microphone]: boolean;
        [PopUpControls.Camera]: boolean;
    };
    togglePopupState: (popupState: PopUpControls) => void;
    permissionPromptStatus: PermissionPromptStatus;
    setPermissionPromptStatus: (permissionPromptStatus: PermissionPromptStatus) => void;
    noDeviceDetected: PermissionPromptStatus;
    setNoDeviceDetected: (permissionPromptStatus: PermissionPromptStatus) => void;
}

export const UIStateContext = createContext<UIStateContextType>({
    meetingReadyPopupOpen: false,
    setMeetingReadyPopupOpen: () => {},
    sideBarState: {
        [MeetingSideBars.Participants]: false,
        [MeetingSideBars.Settings]: false,
        [MeetingSideBars.Chat]: false,
        [MeetingSideBars.MeetingDetails]: false,
    },
    toggleSideBarState: () => {},
    popupState: {
        [PopUpControls.Microphone]: false,
        [PopUpControls.Camera]: false,
    },
    togglePopupState: () => {},
    permissionPromptStatus: PermissionPromptStatus.CLOSED,
    setPermissionPromptStatus: () => {},
    noDeviceDetected: PermissionPromptStatus.CLOSED,
    setNoDeviceDetected: () => {},
});

export const useUIStateContext = () => {
    const context = useContext(UIStateContext);

    return context;
};

export const UIStateProvider = ({
    children,
    instantMeeting,
}: {
    children: React.ReactNode;
    instantMeeting: boolean;
}) => {
    const [meetingReadyPopupOpen, setMeetingReadyPopupOpen] = useState(instantMeeting);
    const [sideBarState, setSideBarState] = useState<UIStateContextType['sideBarState']>({
        [MeetingSideBars.Participants]: false,
        [MeetingSideBars.Settings]: false,
        [MeetingSideBars.Chat]: false,
        [MeetingSideBars.MeetingDetails]: false,
    });

    const [popupState, setPopupState] = useState<UIStateContextType['popupState']>({
        [PopUpControls.Microphone]: false,
        [PopUpControls.Camera]: false,
    });

    const [permissionPromptStatus, setPermissionPromptStatus] = useState(PermissionPromptStatus.CLOSED);
    const [noDeviceDetected, setNoDeviceDetected] = useState(PermissionPromptStatus.CLOSED);

    const toggleSideBarState = useCallback(
        (sidebar: MeetingSideBars) => {
            setSideBarState((prev) => {
                const newSidebards = Object.fromEntries(
                    Object.entries(prev).map(([key, value]) => [key, key === sidebar ? !value : false])
                ) as Record<MeetingSideBars, boolean>;

                return newSidebards;
            });
        },
        [setSideBarState]
    );

    const togglePopupState = useCallback(
        (popup: PopUpControls) => {
            setPopupState((prev) => {
                const newPopupState = Object.fromEntries(
                    Object.entries(prev).map(([key, value]) => [key, key === popup ? !value : false])
                ) as Record<PopUpControls, boolean>;

                return newPopupState;
            });
        },
        [setPopupState]
    );

    return (
        <UIStateContext.Provider
            value={{
                meetingReadyPopupOpen,
                setMeetingReadyPopupOpen,
                sideBarState,
                toggleSideBarState,
                popupState,
                togglePopupState,
                permissionPromptStatus,
                setPermissionPromptStatus,
                noDeviceDetected,
                setNoDeviceDetected,
            }}
        >
            {children}
        </UIStateContext.Provider>
    );
};
