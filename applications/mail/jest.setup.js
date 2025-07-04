import '@testing-library/jest-dom';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// Getting ReferenceError: TextDecoder is not defined without

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// JSDom does not include a full implementation of webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// We mock @proton/wallet & @proton/andromeda to avoid wasm call in tests since Jest don't support wasm for now
jest.mock('@proton/wallet', () => ({
    __esModule: true,
    walletReducers: {},
}));

jest.mock('@proton/andromeda', () => ({
    __esModule: true,
    WasmProtonWalletApiClient: jest.fn(),
}));

// Globally mocked @proton/components modules
jest.mock('@proton/components/hooks/useEventManager.ts', () => {
    const subscribe = jest.fn();
    const call = jest.fn();
    const stop = jest.fn();
    const start = jest.fn();

    const result = () => {
        return { subscribe, call, stop, start };
    };

    result.subscribe = subscribe;
    result.call = call;
    result.stop = stop;
    result.start = start;

    return result;
});

// Globally mocked upload helper (standard requests are mocked through context)
jest.mock('./src/app/helpers/upload');

global.MutationObserver = class {
    disconnect() {} // eslint-disable-line
    observe() {} // eslint-disable-line
};

// Mock window.getComputedStyle to prevent "Not implemented" errors in jsdom, as it's required by useActiveBreakpoint to determine the active breakpoint.
global.window.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
}));

// Mock backdrop container because it's always rendered, and it's rendered in a portal which causes issues with the hook renderer
jest.mock('@proton/components/components/modalTwo/BackdropContainer', () => ({
    __esModule: true,
    default: () => null,
}));

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));

jest.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('@proton/llm/lib/hooks/useAssistant.tsx', () => {
    return {
        __esModule: true,
        useAssistant: jest.fn(() => ({
            assistantConfig: {},
            cancelDownloadModel: jest.fn(),
            cancelRunningAction: jest.fn(),
            canRunAssistant: false,
            canUseAssistant: false,
            closeAssistant: jest.fn(),
            downloadModelSize: 0,
            downloadPaused: false,
            downloadReceivedBytes: 0,
            errors: [],
            generateResult: jest.fn(),
            hasCompatibleBrowser: false,
            hasCompatibleHardware: false,
            initAssistant: jest.fn(),
            isGeneratingResult: false,
            isModelDownloaded: false,
            isModelDownloading: false,
            isModelLoadedOnGPU: false,
            isModelLoadingOnGPU: false,
            openAssistant: jest.fn(),
            openedAssistants: [],
            resetAssistantState: jest.fn(),
            resumeDownloadModel: jest.fn(),
            setAssistantStatus: jest.fn(),
            unloadModelOnGPU: jest.fn(),
            getIsStickyAssistant: jest.fn(),
        })),
    };
});

jest.mock('proton-mail/components/list/tip/useTips.tsx', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({}),
}));

jest.mock('@proton/account/securityCheckup/listener', () => ({
    __esModule: true,
    securityCheckupListener: jest.fn().mockReturnValue({}),
}));

jest.mock('proton-mail/components/list/list-telemetry/useListTelemetry.tsx', () => ({
    ...jest.requireActual('proton-mail/components/list/list-telemetry/useListTelemetry.tsx'),
    __esModule: true,
    folderLocation: () => {
        return 'INBOX';
    },
    getActionFromLabel: () => {
        return 'INBOX';
    },
}));
