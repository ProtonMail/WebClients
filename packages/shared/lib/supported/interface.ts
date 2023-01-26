export const enum SupportedBrowserValue {
    Unsupported = 0,
    Supported = 1,
    Other = -1,
}

declare global {
    interface Window {
        protonSupportedBrowser: SupportedBrowserValue | undefined;
    }
}
