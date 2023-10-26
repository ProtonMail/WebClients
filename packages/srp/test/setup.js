import { after, before } from 'mocha';

import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

before(async () => {
    await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
});

after(async () => {
    await CryptoProxy.releaseEndpoint();
});
