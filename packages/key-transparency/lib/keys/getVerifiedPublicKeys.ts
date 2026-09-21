import type { Api, KTUserContext } from '@proton/shared/lib/interfaces';

import { getAndVerifyApiKeys } from './getAndVerifyApiKeys';

export const getVerifiedPublicKeys = async ({
    api,
    email,
    ktUserContext,
}: {
    email: string;
    api: Api;
    ktUserContext: KTUserContext;
}) => {
    if (!email) {
        throw new Error('Missing email');
    }

    const { addressKeys } = await getAndVerifyApiKeys({
        api,
        email,
        ktUserContext,
        internalKeysOnly: false,
        noCache: true,
    });

    return addressKeys;
};
