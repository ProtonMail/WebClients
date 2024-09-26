import { useConfig, useGetAddressKeys, useGetUser, useGetUserKeys } from '@proton/components';
import { useGetKTActivation } from '@proton/components/containers/keyTransparency/useKTActivation';
import { ktSentryReportError, verifyPublicKeysAddressAndCatchall } from '@proton/key-transparency/lib';
import type { VerifyOutboundPublicKeys } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import useGetLatestEpoch from './useGetLatestEpoch';

const useVerifyOutboundPublicKeys = () => {
    const getKTActivation = useGetKTActivation();
    const getLatestEpoch = useGetLatestEpoch();
    const getUserKeys = useGetUserKeys();
    const getUser = useGetUser();
    const getAddressKeys = useGetAddressKeys();
    const { APP_NAME } = useConfig();

    const verifyOutboundPublicKeys: VerifyOutboundPublicKeys = async ({
        userContext,
        api,
        email,
        skipVerificationOfExternalDomains,
        address,
        catchAll,
    }) => {
        const ktActivation = await getKTActivation();
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return {};
        }
        return verifyPublicKeysAddressAndCatchall({
            userContext: userContext ?? {
                appName: APP_NAME,
                getUserKeys,
                getAddressKeys,
                getUser,
            },
            api,
            getLatestEpoch,
            email,
            skipVerificationOfExternalDomains,
            address,
            catchAll,
        }).catch((error) => {
            ktSentryReportError(error, { context: 'VerifyOutboundPublicKeys' });
            return {};
        });
    };

    return verifyOutboundPublicKeys;
};

export default useVerifyOutboundPublicKeys;
