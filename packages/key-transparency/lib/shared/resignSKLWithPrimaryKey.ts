import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ResignSKLWithPrimaryKeyArguments } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getSignedKeyListSignature } from '@proton/shared/lib/keys';

import { fetchSignedKeyLists } from '../helpers/apiHelpers';
import { fetchVerifiedEpoch, updateSignedKeyListSignature } from '../helpers/apiHelpers';
import { ktSentryReportError } from '../helpers/utils';
import { verifySKLSignature } from '../verification/verifyKeys';

export const resignSKLWithPrimaryKey = async ({
    api: normalApi,
    ktActivation,
    address,
    newPrimaryKeys,
    formerPrimaryKeys,
    userKeys,
}: ResignSKLWithPrimaryKeyArguments) => {
    try {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }
        const api = getSilentApi(normalApi);
        const userVerificationKeys = userKeys.map((key) => key.publicKey);
        const verifiedEpoch = await fetchVerifiedEpoch(address, api, userVerificationKeys);
        const skls = await fetchSignedKeyLists(api, verifiedEpoch?.Revision ?? 0, address.Email);
        await Promise.all(
            skls.map(async (skl) => {
                if (skl.Data && skl.Signature) {
                    const timestamp = await verifySKLSignature(formerPrimaryKeys, skl.Data, skl.Signature);
                    if (!timestamp) {
                        return;
                    }
                    const newSignature = await getSignedKeyListSignature(skl.Data, newPrimaryKeys, timestamp);
                    await updateSignedKeyListSignature(address.ID, skl.Revision, newSignature, api);
                }
            })
        );
    } catch (error: any) {
        ktSentryReportError(error, { context: 'resignSKLWithPrimaryKey' });
    }
};
