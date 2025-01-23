import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import type { ResetSelfAudit } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { fetchLatestEpoch, uploadVerifiedEpoch } from '../helpers/apiHelpers';
import { ktSentryReportError } from '../helpers/utils';
import type { VerifiedEpoch } from '../interfaces';

/**
 *
 * Upload a fresh verified epoch to avoid failing self audit
 * after a password reset.
 */
export const resetSelfAudit: ResetSelfAudit = async ({
    ktActivation,
    api,
    user,
    keyPassword,
    addressesBeforeReset,
}) => {
    if (ktActivation === KeyTransparencyActivation.DISABLED) {
        return;
    }
    try {
        const [userKeys, { EpochID }] = await Promise.all([
            getDecryptedUserKeysHelper(user, keyPassword),
            fetchLatestEpoch(api),
        ]);
        if (!userKeys.length) {
            return;
        }
        await Promise.all(
            addressesBeforeReset
                .filter((address) => !getIsAddressDisabled(address))
                .map(async (address) => {
                    if (!address.SignedKeyList) {
                        return;
                    }
                    const { Revision } = address.SignedKeyList;
                    if (!Revision) {
                        return;
                    }
                    const newVerifiedEpoch: VerifiedEpoch = {
                        EpochID,
                        Revision: Revision,
                        SKLCreationTime: 0,
                    };
                    await uploadVerifiedEpoch(newVerifiedEpoch, address.ID, userKeys[0].privateKey, api);
                })
        );
    } catch (error: any) {
        ktSentryReportError(error, { context: 'resetSelfAudit' });
    }
};
