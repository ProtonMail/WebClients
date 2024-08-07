import type { ContextBridgeApi } from './types/desktop';

declare global {
    declare const BUILD_TARGET: string;
    declare const DESKTOP_BUILD: boolean;
    declare const ENV: string;
    declare const EXTENSION_BUILD: boolean;
    declare const OFFLINE_SUPPORTED: boolean;
    declare const REDUX_DEVTOOLS_PORT: number;
    declare const RESUME_FALLBACK: boolean;
    declare const RUNTIME_RELOAD_PORT: number;
    declare const RUNTIME_RELOAD: boolean;
    declare const VERSION: string;

    interface Window {
        ctxBridge?: ContextBridgeApi;
    }
}
