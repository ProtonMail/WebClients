import * as matchers from '@testing-library/jest-dom/matchers';
import { webcrypto } from 'crypto';
import { expect } from 'vitest';

import '@proton/testing/lib/vitest/mockMatchMedia';
import '@proton/testing/lib/vitest/mockUnleash';

expect.extend(matchers);

// Stub for webpack's `require.context`, rewritten into module code by the vitest config plugin.
// Returns an empty context, which is sufficient for tests that don't assert on the loaded assets.
(globalThis as any).__requireContext = () => {
    const context: any = () => '';
    context.keys = () => [];
    context.resolve = (key: string) => key;
    context.id = '';
    return context;
};

window.ResizeObserver = class {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

// JSDom does not include a full implementation of webcrypto. Only patch it in if
// the environment doesn't already expose `crypto.subtle` (Node's webcrypto does).
if (!global.crypto.subtle) {
    Object.defineProperty(global.crypto, 'subtle', {
        configurable: true,
        value: webcrypto.subtle,
    });
}

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Globally mocked @proton/components modules
vi.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = vi.fn();
    const call = vi.fn();
    const stop = vi.fn();
    const start = vi.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return { __esModule: true, default: result };
});

global.MutationObserver = class {
    disconnect() {}
    observe() {}
} as unknown as typeof MutationObserver;

class MockIntersectionObserver {
    callback: any;

    options: any;

    constructor(callback: any, options: any) {
        this.callback = callback;
        this.options = options;
    }

    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();

    // helper to trigger intersection manually
    trigger(entries: any) {
        this.callback(entries, this);
    }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.getComputedStyle to prevent "Not implemented" errors in jsdom, as it's required by useActiveBreakpoint to determine the active breakpoint.
global.window.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
})) as unknown as typeof window.getComputedStyle;

// Mock backdrop container because it's always rendered, and it's rendered in a portal which causes issues with the hook renderer
vi.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn() as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Avoid loading the heavy date-fns locale bundle. Vitest validates named exports against
// the mock, so every export the consumers read is stubbed here.
vi.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
    enUSLocale: {},
    enGBLocale: {},
    faIRLocale: {},
    getDateFnLocale: vi.fn(() => ({})),
    default: {},
}));

vi.mock('@proton/llm/lib/hooks/useAssistant.tsx', () => {
    return {
        __esModule: true,
        useAssistant: vi.fn(() => ({
            assistantConfig: {},
            cancelDownloadModel: vi.fn(),
            cancelRunningAction: vi.fn(),
            canRunAssistant: false,
            canUseAssistant: false,
            closeAssistant: vi.fn(),
            downloadModelSize: 0,
            downloadPaused: false,
            downloadReceivedBytes: 0,
            errors: [],
            generateResult: vi.fn(),
            hasCompatibleBrowser: false,
            hasCompatibleHardware: false,
            initAssistant: vi.fn(),
            isGeneratingResult: false,
            isModelDownloaded: false,
            isModelDownloading: false,
            isModelLoadedOnGPU: false,
            isModelLoadingOnGPU: false,
            openAssistant: vi.fn(),
            openedAssistants: [],
            resetAssistantState: vi.fn(),
            resumeDownloadModel: vi.fn(),
            setAssistantStatus: vi.fn(),
            unloadModelOnGPU: vi.fn(),
            getIsStickyAssistant: vi.fn(),
        })),
    };
});

vi.mock('@proton/account/securityCheckup/listener', () => ({
    __esModule: true,
    securityCheckupListener: vi.fn().mockReturnValue({}),
}));
