import { serverTime } from '@proton/crypto';
import type {
    Address,
    DecryptedKey,
    PreAuthKTVerifier,
    PreAuthKTVerify,
    SignedKeyList,
} from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { fetchSignedKeyLists } from '../helpers/apiHelpers';
import { ktSentryReport, ktSentryReportError } from '../helpers/utils';
import { commitSKLToLS } from '../storage/storageHelpers';
import { getDefaultKTLS } from './defaults';

/**
 * Return a KT verifier for when getSignedKeyList is called before apps are properly mounted,
 * e.g. signup or login, such that self audit couldn't have run and user keys are not directly accessible
 */
export const createPreAuthKTVerifier = (ktActivation: KeyTransparencyActivation): PreAuthKTVerifier => {
    interface CreatedSKL {
        address: Address;
        revision?: number;
        userKeys: DecryptedKey[];
        signedKeyList: SignedKeyList;
        creationTimestamp: number;
    }

    var createdSKLs: CreatedSKL[] = [];

    const ktLSAPI = getDefaultKTLS();

    const preAuthKTVerify: PreAuthKTVerify = (userKeys: DecryptedKey[]) => async (address, signedKeyList) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }
        createdSKLs.push({
            address,
            revision: address.SignedKeyList?.Revision,
            userKeys,
            signedKeyList,
            creationTimestamp: +serverTime(),
        });
    };

    const preAuthKTCommit: PreAuthKTVerifier['preAuthKTCommit'] = async (userID, api) => {
        try {
            if (ktActivation === KeyTransparencyActivation.DISABLED) {
                return;
            }

            if (!createdSKLs.length) {
                return;
            }

            for (const savedSKL of createdSKLs) {
                const allSKLs = await fetchSignedKeyLists(api, savedSKL.revision ?? 0, savedSKL.address.Email);
                const correspondingSKL = allSKLs.find((skl) => savedSKL.signedKeyList.Data == skl.Data);
                if (!correspondingSKL || !correspondingSKL.Revision || !correspondingSKL.ExpectedMinEpochID) {
                    ktSentryReport('Could not find new SKL revision and expectedMinEpochID', {
                        email: savedSKL.address.Email,
                    });
                    return;
                }
                const privateKeys = savedSKL.userKeys.map(({ privateKey }) => privateKey);
                const ktBlob = {
                    creationTimestamp: savedSKL.creationTimestamp,
                    expectedMinEpochID: correspondingSKL.ExpectedMinEpochID,
                    revision: correspondingSKL.Revision,
                    email: savedSKL.address.Email,
                    data: savedSKL.signedKeyList.Data,
                };
                await commitSKLToLS(ktBlob, privateKeys, ktLSAPI, userID, savedSKL.address.ID);
            }
            createdSKLs = [];
        } catch (error: any) {
            ktSentryReportError(error, { context: 'preAuthKTCommit' });
        }
    };

    return {
        preAuthKTVerify,
        preAuthKTCommit,
    };
};
