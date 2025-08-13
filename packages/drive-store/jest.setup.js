import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

// Getting ReferenceError: TextDecoder is not defined without
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.OffscreenCanvas = Object;

// JSDom does not include a full implementation of webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

// Mock canvas (for e.g. canvasUtils tests)
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
    callback(new Blob(['abc']));
});

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));

jest.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({
    __esModule: true,
}));

jest.mock('@proton/raw-images', () => ({
    __esModule: true,
}));

jest.mock('./store/_downloads/fileSaver/download.ts', () => {
    return {
        initDownloadSW: jest.fn().mockResolvedValue(true),
    };
});

jest.mock('./store/_uploads/initUploadFileWorker.ts', () => {
    return {
        initUploadFileWorker: jest.fn(),
    };
});

jest.mock('./utils/metrics/userSuccessMetrics.ts', () => {
    return {
        userSuccessMetrics: {
            init: jest.fn(),
            mark: jest.fn(),
        },
    };
});

// Mock VPN flag to prevent those issues
// TypeError: require.context is not a function
// > 1 | const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);
jest.mock('@proton/components/containers/vpn/flag', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));

jest.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    getFlagSvg: jest.fn().mockImplementation((it) => it),
}));
