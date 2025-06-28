import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ResignSKLWithPrimaryKeyArguments } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getSignedKeyListSignature } from '@proton/shared/lib/keys';

import { fetchSignedKeyLists } from '../helpers/apiHelpers';
import { fetchVerifiedEpoch, updateSignedKeyListSignature } from '../helpers/apiHelpers';
import { ktSentryReportError } from '../helpers/utils';
import { verifySKLSignature } from '../verification/verifyKeys';

/**
 * Resigning old SKLs is needed on primary key changes,
 * as non-primary keys may not be available for future SKL verifications
 * if they are deleted or marked as compromised.
 */
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
                    const timestamp = await verifySKLSignature({
                        verificationKeys: formerPrimaryKeys,
                        signedKeyListData: skl.Data,
                        signedKeyListSignature: skl.Signature,
                    });
                    if (!timestamp) {
                        return;
                    }
                    // To resign an old SKL, we need the `newPrimaryKeys` to be valid at `timestamp`:
                    // for newly generated or imported keys, this won't be the case.
                    // We simply check the key creation time, as this covers most cases, and this
                    // re-signing step is a best-effort solution.
                    // Signing might still fail depending on the actual signing (sub)key validity.
                    if (newPrimaryKeys.some((key) => key.getCreationTime() > timestamp)) {
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
