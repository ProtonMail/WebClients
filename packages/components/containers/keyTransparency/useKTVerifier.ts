import { useRef } from 'react';

import { PartialKTBlobContent, commitOwnKeystoLS, verifyAuditAddressesResult } from '@proton/key-transparency';
import {
    Api,
    DecryptedKey,
    KeyTransparencyActivation,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    UserModel,
} from '@proton/shared/lib/interfaces';

import useGetKTActivation from './useGetKTActivation';
import { useKeyTransparencyContext } from './useKeyTransparencyContext';

interface KTBlobSelf {
    ktBlobContent: PartialKTBlobContent;
    addressID: string;
    userID: string;
}

/**
 * Return a KT verifier for when the state exists, i.e. we are inside the apps
 * and therefore self audit could run and the normal flow of verification can be performed
 */
const useKTVerifier = (api: Api, getUser: () => Promise<UserModel>) => {
    const { getKTState } = useKeyTransparencyContext();
    const getKTActivation = useGetKTActivation();
    const { selfAuditPromise, ktLSAPI } = getKTState().current;
    const ktBlobValues = useRef<KTBlobSelf[]>([]);

    const keyTransparencyVerify: KeyTransparencyVerify = async (address, signedKeyList, publicKeys) => {
        if ((await getKTActivation()) === KeyTransparencyActivation.DISABLED) {
            return;
        }

        let ktBlobContent: PartialKTBlobContent;
        try {
            ktBlobContent = await verifyAuditAddressesResult(address, signedKeyList, selfAuditPromise, publicKeys);
        } catch (error: any) {
            // In case of error here, for now we only log to sentry
            // the problem without stopping users' operativity
            return;
        }

        const { ID } = await getUser();

        ktBlobValues.current.push({
            ktBlobContent,
            addressID: address.ID,
            userID: ID,
        });
    };

    const keyTransparencyCommit: KeyTransparencyCommit = async (userKeys: DecryptedKey[]) => {
        if ((await getKTActivation()) === KeyTransparencyActivation.DISABLED) {
            return;
        }

        const privateKeys = userKeys.map(({ privateKey }) => privateKey);
        let extendedKTBlobValue = ktBlobValues.current.shift();
        while (!!extendedKTBlobValue) {
            const { addressID, userID, ktBlobContent } = extendedKTBlobValue;
            await commitOwnKeystoLS(ktBlobContent, privateKeys, api, ktLSAPI, userID, addressID);
            extendedKTBlobValue = ktBlobValues.current.shift();
        }
    };

    return {
        keyTransparencyVerify,
        keyTransparencyCommit,
    };
};

export default useKTVerifier;
