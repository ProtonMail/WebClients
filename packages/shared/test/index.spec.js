import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

// Initialize CryptoProxy using a non-worker endpoint
CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

const testsContext = require.context('.', true, /\.(spec|test)\.(js|tsx?)$/);
testsContext.keys().forEach(testsContext);
