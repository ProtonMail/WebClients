import './vitest.typedArrays';
import '@proton/vitest-config/setup';
import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/from-hex';
import 'core-js/actual/typed-array/to-base64';
import 'core-js/actual/typed-array/to-hex';
import { atob, btoa } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { performance as nodePerformance } from 'node:perf_hooks';
import * as webStreams from 'node:stream/web';
import { BroadcastChannel } from 'node:worker_threads';

import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/unleash/testing/vitest/mockUnleash';

// Our CSS reset shows <dialog> without `open`, tests do not load it
const style = document.createElement('style');
style.textContent = 'dialog { display: block; }';
document.head.append(style);

// React listens for `animationend` through AnimationEvent, which the DOM environment lacks
(globalThis as any).AnimationEvent ??= class AnimationEvent extends Event {
    animationName: string;

    elapsedTime: number;

    pseudoElement: string;

    constructor(type: string, init: AnimationEventInit = {}) {
        const { animationName = '', elapsedTime = 0, pseudoElement = '', ...eventInit } = init;
        super(type, eventInit);
        this.animationName = animationName;
        this.elapsedTime = elapsedTime;
        this.pseudoElement = pseudoElement;
    }
};

window.ResizeObserver = vi.fn(function () {
    return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    };
}) as unknown as typeof ResizeObserver;

if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
}

(['mark', 'measure', 'clearMarks', 'clearMeasures', 'getEntriesByName'] as const).forEach((method) => {
    if (typeof (globalThis.performance as any)[method] !== 'function') {
        (globalThis.performance as any)[method] = (nodePerformance as any)[method].bind(nodePerformance);
    }
});

// The vm context of the test pool does not expose these Node globals (msw and OpenPGP need them)
(['TransformStream', 'ReadableStream', 'WritableStream'] as const).forEach((name) => {
    if (!(name in globalThis)) {
        (globalThis as any)[name] = (webStreams as any)[name];
    }
});

// happy-dom's atob rejects the base64 chunks OpenPGP decodes, Node's does not
globalThis.atob = atob;
globalThis.btoa = btoa;

if (!('BroadcastChannel' in globalThis)) {
    (globalThis as any).BroadcastChannel = BroadcastChannel;
}

global.MutationObserver = class {
    disconnect() {}
    observe() {}
    // roosterjs 9 flushes pending mutations
    takeRecords() {
        return [];
    }
} as unknown as typeof MutationObserver;

// useActiveBreakpoint reads the computed style to find the active breakpoint
window.getComputedStyle = vi.fn(() => {
    return {
        getPropertyValue: vi.fn(() => {
            return '';
        }),
    };
}) as unknown as typeof window.getComputedStyle;

// Silence canvas warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = vi.fn();

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// The Sentry SDK is heavy to load and never sends anything in tests (see the mock for details)
vi.mock('@sentry/browser', async () => {
    const mock: any = await vi.importActual('./src/__mocks__/sentryBrowser');
    return { __esModule: true, ...mock.default, default: mock.default };
});

// Globally mocked @proton/components modules
vi.mock('@proton/components/hooks/useEventManager', () => {
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

// Globally mocked upload helper (standard requests are mocked through context)
vi.mock('@proton/mail-composer/helpers/upload', async () => {
    return vi.importActual('./src/__mocks__/mailComposerUpload');
});

// Mock backdrop container because it's always rendered, and it's rendered in a portal which causes issues with the hook renderer
vi.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/llm/lib/hooks/useAssistant', () => {
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

vi.mock('proton-mail/components/list/tip/useTips.tsx', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({}),
}));

vi.mock('proton-mail/components/list/list-telemetry/useListTelemetry.tsx', async () => ({
    ...(await vi.importActual('proton-mail/components/list/list-telemetry/useListTelemetry.tsx')),
    __esModule: true,
    folderLocation: () => {
        return 'INBOX';
    },
    getActionFromLabel: () => {
        return 'INBOX';
    },
}));

vi.mock('./src/app/hooks/useShowBYOESpotlightModal', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('./src/app/hooks/useShowBYOEInboxCleanupModal', () => ({
    __esModule: true,
    default: vi.fn(),
}));
