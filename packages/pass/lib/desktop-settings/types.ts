export type ClipboardStoreProperties = {
    timeoutMs?: number;
};

export type DesktopSettingsDTO = {
    clipboard?: Required<ClipboardStoreProperties>;
};
