import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

// Initialize CryptoProxy using a non-worker endpoint
CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

// ESM-friendly replacement for require.context
const testsContext = import.meta.webpackContext('.', {
    recursive: true,
    regExp: /\.(spec|test)\.(js|tsx?)$/,
});

// Execute all matched test modules
testsContext.keys().forEach((k) => testsContext(k));
