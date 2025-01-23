import { serverTime } from '@proton/crypto';
import type {
    Address,
    Api,
    DecryptedKey,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    ProtonConfig,
    SignedKeyList,
    User,
} from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { getKTLocalStorage } from '../storage/ktStorageAPI';
import { commitSKLToLS } from '../storage/storageHelpers';
import { fetchSignedKeyLists } from './apiHelpers';
import { ktSentryReport, ktSentryReportError } from './utils';

interface CreatedSKL {
    address: Address;
    revision?: number;
    signedKeyList: SignedKeyList;
    creationTimestamp: number;
}

/**
 * Return a KT verifier for when the state exists, i.e. we are inside the apps
 * and therefore self audit could run and the normal flow of verification can be performed
 */
export const createKTVerifier = ({
    ktActivation,
    config,
    api,
}: {
    ktActivation: KeyTransparencyActivation;
    config: ProtonConfig;
    api: Api;
}) => {
    const createdSKLs: CreatedSKL[] = [];

    const keyTransparencyVerify: KeyTransparencyVerify = async (address: Address, signedKeyList: SignedKeyList) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }

        createdSKLs.push({
            address,
            revision: address.SignedKeyList?.Revision,
            signedKeyList,
            creationTimestamp: +serverTime(),
        });
    };

    const keyTransparencyCommit: KeyTransparencyCommit = async (user: User, userKeys: DecryptedKey[]) => {
        try {
            if (ktActivation === KeyTransparencyActivation.DISABLED) {
                return;
            }

            if (!createdSKLs.length) {
                return;
            }

            const privateKeys = userKeys.map(({ privateKey }) => privateKey);

            const ktLSAPIPromise = getKTLocalStorage(config.APP_NAME);
            const ktLSAPI = await ktLSAPIPromise;
            for (const savedSKL of createdSKLs) {
                const allSKLs = await fetchSignedKeyLists(api, savedSKL?.revision ?? 0, savedSKL.address.Email);
                const correspondingSKL = allSKLs.find((skl) => savedSKL.signedKeyList.Data == skl.Data);
                if (!correspondingSKL || !correspondingSKL.Revision || !correspondingSKL.ExpectedMinEpochID) {
                    ktSentryReport('Could not find new SKL revision and expectedMinEpochID', {
                        email: savedSKL.address.Email,
                    });
                    return;
                }
                const ktBlob = {
                    creationTimestamp: savedSKL.creationTimestamp,
                    expectedMinEpochID: correspondingSKL.ExpectedMinEpochID,
                    revision: correspondingSKL.Revision,
                    email: savedSKL.address.Email,
                    data: savedSKL.signedKeyList.Data,
                };
                await commitSKLToLS(ktBlob, privateKeys, ktLSAPI, user.ID, savedSKL.address.ID);
            }
            createdSKLs.length = 0;
        } catch (error: any) {
            ktSentryReportError(error, { context: 'KeyTransparencyCommit' });
        }
    };

    return {
        keyTransparencyVerify,
        keyTransparencyCommit,
    };
};
