export const sendRecordingSaveStateToDesktopApp = (isInProgress: boolean) => {
    window.ipcMeetMessageBroker?.setRecordingSaveInProgress?.(isInProgress);
};
