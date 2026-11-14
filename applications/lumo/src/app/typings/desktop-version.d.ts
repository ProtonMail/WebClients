declare global {
    interface Window {
        /** Compiled desktop version, injected by Tauri before the web app initializes. */
        lumoDesktopVersion?: string;
    }
}

export {};
