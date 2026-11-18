export const sendLocaleToDesktopApp = (localeCode: string) => {
    window.ipcMeetMessageBroker?.setLocale?.(localeCode);
};
