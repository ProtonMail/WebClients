import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto.subtle = require('crypto').webcrypto.subtle;
global.HTMLCanvasElement.prototype.getContext = jest.fn();

jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({ __esModule: true, loadCryptoWorker: jest.fn() }));

jest.mock('./src/lib/logger');
jest.mock('./src/lib/app/env', () => ({ config: { API_URL: 'https://proton.test' } }));
