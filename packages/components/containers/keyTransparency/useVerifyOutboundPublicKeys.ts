import { ktSentryReportError, verifyPublicKeysAddressAndCatchall } from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    ArmoredKeyWithFlags,
    FetchedSignedKeyList,
    KeyTransparencyActivation,
    KeyTransparencyVerificationResult,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';
import useGetLatestEpoch from './useGetLatestEpoch';
import useKTActivation from './useKTActivation';
import useSaveSKLToLS from './useSaveSKLToLS';

const useVerifyOutboundPublicKeys = () => {
    const ktActivation = useKTActivation();
    const saveSKLToLS = useSaveSKLToLS();
    const api = getSilentApi(useApi());
    const getLatestEpoch = useGetLatestEpoch();

    const verifyOutboundPublicKeys: VerifyOutboundPublicKeys = async (
        email: string,
        keysIntendendedForEmail: boolean,
        address: {
            keyList: ArmoredKeyWithFlags[];
            signedKeyList: FetchedSignedKeyList | null;
        },
        catchAll?: {
            keyList: ArmoredKeyWithFlags[];
            signedKeyList: FetchedSignedKeyList | null;
        }
    ): Promise<{
        addressKTResult?: KeyTransparencyVerificationResult;
        catchAllKTResult?: KeyTransparencyVerificationResult;
    }> => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return {};
        }
        return verifyPublicKeysAddressAndCatchall(
            api,
            saveSKLToLS,
            getLatestEpoch,
            email,
            keysIntendendedForEmail,
            address,
            catchAll
        ).catch((error) => {
            ktSentryReportError(error, { context: 'VerifyOutboundPublicKeys' });
            return {};
        });
    };

    return verifyOutboundPublicKeys;
};

export default useVerifyOutboundPublicKeys;
