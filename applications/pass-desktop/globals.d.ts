import { type ContextBridgeApi } from './src/preload';

declare global {
    // Injected by Electron Forge
    const MAIN_WINDOW_WEBPACK_ENTRY: string;
    const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

    // Injected by Webpack
    const ENV: string;
    const BUILD_TARGET: string;

    // Injected by preload.ts
    interface Window {
        ctxBridge: ContextBridgeApi;
    }
}
