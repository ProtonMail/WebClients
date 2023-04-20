import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';

CryptoApi.init();
CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

export * from './pass-crypto';
