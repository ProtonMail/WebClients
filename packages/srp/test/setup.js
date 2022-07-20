import { after, before } from 'mocha';
import 'jsdom-global/register';
import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

// JSDom does not include webcrypto
global.crypto = require('crypto').webcrypto;

before(async () => {
    await CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
});

after(async () => {
    await CryptoProxy.releaseEndpoint();
});
