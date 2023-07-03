import { useRef } from 'react';

import { serverTime } from '@proton/crypto';
import {
    commitSKLToLS,
    fetchSignedKeyLists,
    getKTLocalStorage,
    ktSentryReport,
    ktSentryReportError,
} from '@proton/key-transparency';
import {
    Address,
    Api,
    DecryptedKey,
    KeyTransparencyActivation,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    SignedKeyList,
    UserModel,
} from '@proton/shared/lib/interfaces';

import { useConfig } from '../../hooks';
import useKTActivation from './useKTActivation';

/**
 * Return a KT verifier for when the state exists, i.e. we are inside the apps
 * and therefore self audit could run and the normal flow of verification can be performed
 */
const useKTVerifier = (api: Api, getUser: () => Promise<UserModel>) => {
    const { APP_NAME } = useConfig();
    const ktLSAPI = getKTLocalStorage(APP_NAME);
    const ktActivation = useKTActivation();

    interface CreatedSKL {
        address: Address;
        revision?: number;
        signedKeyList: SignedKeyList;
        creationTimestamp: number;
    }
    const createdSKLs = useRef<CreatedSKL[]>([]);

    const keyTransparencyVerify: KeyTransparencyVerify = async (address, signedKeyList) => {
        if (ktActivation === KeyTransparencyActivation.DISABLED) {
            return;
        }

        createdSKLs.current.push({
            address,
            revision: address.SignedKeyList?.Revision,
            signedKeyList,
            creationTimestamp: +serverTime(),
        });
    };

    const keyTransparencyCommit: KeyTransparencyCommit = async (userKeys: DecryptedKey[]) => {
        try {
            if (ktActivation === KeyTransparencyActivation.DISABLED) {
                return;
            }

            if (!createdSKLs.current.length) {
                return;
            }

            const user = await getUser();

            const privateKeys = userKeys.map(({ privateKey }) => privateKey);

            for (const savedSKL of createdSKLs.current) {
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
            createdSKLs.current = [];
        } catch (error: any) {
            ktSentryReportError(error, { context: 'KeyTransparencyCommit' });
        }
    };

    return {
        keyTransparencyVerify,
        keyTransparencyCommit,
    };
};

export default useKTVerifier;
