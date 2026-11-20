import 'core-js/actual/typed-array/from-base64';
import 'core-js/actual/typed-array/to-base64';
import { webcrypto } from 'node:crypto';

vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({ loadCryptoWorker: vi.fn() }));
vi.mock('./src/lib/logger');
vi.mock('./src/lib/app/env', () => ({ config: { API_URL: 'https://proton.test' } }));

if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn();
}
