import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto.subtle = require('crypto').webcrypto.subtle;
global.HTMLCanvasElement.prototype.getContext = jest.fn();

jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({ __esModule: true, loadCryptoWorker: jest.fn() }));
jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({ __esModule: true }));
jest.mock('@proton/shared/lib/pow/wasmWorkerWrapper.ts', () => ({ __esModule: true }));
jest.mock('@proton/shared/lib/pow/pbkdfWorkerWrapper.ts', () => ({ __esModule: true }));

jest.mock('proton-authenticator/lib/logger');
jest.mock('proton-authenticator/lib/app/env', () => ({ config: { API_URL: 'https://proton.test' } }));
