import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import {
    fetchSignedKeyLists,
    fetchVerifiedEpoch,
    ktSentryReportError,
    updateSignedKeyListSignature,
    verifySKLSignature,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ResignSKLWithPrimaryKey, ResignSKLWithPrimaryKeyArguments } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getSignedKeyListSignature } from '@proton/shared/lib/keys';

import { useApi } from '../../hooks';

const useResignSKLWithPrimaryKey = (): ResignSKLWithPrimaryKey => {
    const api = getSilentApi(useApi());
    const ktActivation = useKTActivation();

    const resignSKLWithPrimaryKey = async ({
        address,
        newPrimaryKey,
        formerPrimaryKey,
        userKeys,
    }: ResignSKLWithPrimaryKeyArguments) => {
        try {
            if (ktActivation === KeyTransparencyActivation.DISABLED) {
                return;
            }
            const userVerificationKeys = userKeys.map((key) => key.publicKey);
            const verifiedEpoch = await fetchVerifiedEpoch(address, api, userVerificationKeys);
            const skls = await fetchSignedKeyLists(api, verifiedEpoch?.Revision ?? 0, address.Email);
            await Promise.all(
                skls.map(async (skl) => {
                    if (skl.Data && skl.Signature) {
                        const timestamp = await verifySKLSignature([formerPrimaryKey], skl.Data, skl.Signature);
                        if (!timestamp) {
                            return;
                        }
                        const newSignature = await getSignedKeyListSignature(skl.Data, newPrimaryKey, timestamp);
                        await updateSignedKeyListSignature(address.ID, skl.Revision, newSignature, api);
                    }
                })
            );
        } catch (error: any) {
            ktSentryReportError(error, { context: 'resignSKLWithPrimaryKey' });
        }
    };

    return resignSKLWithPrimaryKey;
};

export default useResignSKLWithPrimaryKey;
