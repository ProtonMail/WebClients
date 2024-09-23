import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import type { VerifiedEpoch } from '@proton/key-transparency/lib';
import { fetchLatestEpoch, ktSentryReportError, uploadVerifiedEpoch } from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import type { Address, ResetSelfAudit, User } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { useApi } from '../../hooks';

/**
 *
 * Upload a fresh verified epoch to avoid failing self audit
 * after a password reset.
 */
const useResetSelfAudit = () => {
    const api = getSilentApi(useApi());
    const ktActivation = useKTActivation();
    const resetSelfAudit: ResetSelfAudit = async (user: User, keyPassword: string, addressesBeforeReset: Address[]) => {
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

    return resetSelfAudit;
};

export default useResetSelfAudit;
