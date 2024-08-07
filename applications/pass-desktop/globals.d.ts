import '@proton/pass/globals.d';

declare global {
    /* Injected by Electron Forge */
    const MAIN_WINDOW_WEBPACK_ENTRY: string;
    const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
}
