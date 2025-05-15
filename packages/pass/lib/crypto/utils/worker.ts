import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { PassCryptoError } from './errors';

export const loadCoreCryptoWorker = () =>
    loadCryptoWorker({ openpgpConfigOptions: { enforceOpenpgpGrammar: true } }).catch(() => {
        throw new PassCryptoError('Could not load crypto worker');
    });
