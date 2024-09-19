import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import { ktSentryReportError, verifyPublicKeysAddressAndCatchall } from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type {
    FetchedSignedKeyList,
    KeyTransparencyVerificationResult,
    ProcessedApiKey,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';
import useGetLatestEpoch from './useGetLatestEpoch';
import useSaveSKLToLS from './useSaveSKLToLS';

const useVerifyOutboundPublicKeys = () => {
    const ktActivation = useKTActivation();
    const saveSKLToLS = useSaveSKLToLS();
    const api = getSilentApi(useApi());
    const getLatestEpoch = useGetLatestEpoch();

    const verifyOutboundPublicKeys: VerifyOutboundPublicKeys = async (
        email: string,
        skipVerificationOfExternalDomains: boolean,
        address: {
            keyList: ProcessedApiKey[];
            signedKeyList: FetchedSignedKeyList | null;
        },
        catchAll?: {
            keyList: ProcessedApiKey[];
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
            skipVerificationOfExternalDomains,
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
