import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

// Initialize CryptoProxy using a non-worker endpoint
CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

(function (defineProperty) {
    Object.defineProperty = (obj, prop, desc) => {
        desc.configurable = true;
        return defineProperty(obj, prop, desc);
    };
})(Object.defineProperty);

const testsContext = require.context('.', true, /.spec.(js|tsx?)$/);
testsContext.keys().forEach(testsContext);
