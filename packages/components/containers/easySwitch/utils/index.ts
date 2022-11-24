import { NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';

import { ImportProvider } from '../logic/types/shared.types';

/**
 * @deprecated use this only during migration from old to new provider enum
 */
export const newToOldImapProvider = (provider: ImportProvider): NON_OAUTH_PROVIDER => {
    if (provider === ImportProvider.DEFAULT) {
        return NON_OAUTH_PROVIDER.DEFAULT;
    }
    if (provider === ImportProvider.OUTLOOK) {
        return NON_OAUTH_PROVIDER.OUTLOOK;
    }
    if (provider === ImportProvider.YAHOO) {
        return NON_OAUTH_PROVIDER.YAHOO;
    }

    throw new Error('Unknown provider');
};
