import type { ContextBridgeApi } from './types/desktop';

declare global {
    const BETA: boolean;
    const BUILD_TARGET: string;
    const BUILD_STORE_TARGET: string;
    const DESKTOP_BUILD: boolean;
    const E2E_TESTS: boolean;
    const ENV: string;
    const EXTENSION_BUILD: boolean;
    const OFFLINE_SUPPORTED: boolean;
    const REDUX_DEVTOOLS_PORT: number;
    const RESUME_FALLBACK: boolean;
    const RUNTIME_RELOAD_PORT: number;
    const RUNTIME_RELOAD: boolean;
    const VERSION: string;

    interface Window {
        ctxBridge?: ContextBridgeApi;
    }

    interface PublicKeyCredentialCreationOptions {
        hints?: ('client-device' | 'security-key' | 'hybrid')[];
    }
}
