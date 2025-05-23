import { useCallback } from 'react';

import { getKTUserContext } from '@proton/account/kt/actions';
import useApi from '@proton/components/hooks/useApi';
import { CryptoProxy, type PublicKeyReference } from '@proton/crypto/lib';
import { useDispatch } from '@proton/redux-shared-store';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { type ProcessedApiKey } from '@proton/shared/lib/interfaces';
import { getKeyHasFlagsToVerify } from '@proton/shared/lib/keys';
import { verifySignedData } from '@proton/wallet';

const getVerifiedAddressKey = async (
    addressKeys: ProcessedApiKey[],
    btc?: {
        btcAddress: string;
        btcAddressSignature: string;
    }
): Promise<PublicKeyReference | undefined> => {
    const keysAbleToVerify = addressKeys.filter((k) => {
        return getKeyHasFlagsToVerify(k.flags);
    });

    // If btc data is provided, we keep only the key that verify the signature
    if (btc) {
        const keys = await Promise.allSettled(
            keysAbleToVerify.map(async (addressKey) => {
                const pubkey = await CryptoProxy.importPublicKey({ armoredKey: addressKey.armoredKey });
                const isVerified = await verifySignedData(
                    btc.btcAddress,
                    btc.btcAddressSignature,
                    'wallet.bitcoin-address',
                    [pubkey]
                );

                return isVerified ? pubkey : null;
            })
        );

        return keys
            .map((result) => ('value' in result ? result.value : undefined))
            .filter((key): key is PublicKeyReference => !!key)
            .at(0);
    }

    return keysAbleToVerify.at(0)?.publicKey;
};

export const useGetRecipientVerifiedAddressKey = () => {
    const api = useApi();
    const dispatch = useDispatch();

    return useCallback(
        async (
            email: string,
            btc?: {
                btcAddress: string;
                btcAddressSignature: string;
            }
        ) => {
            // Bitcoin address signature verification
            const { addressKeys } = await getAndVerifyApiKeys({
                api,
                email,
                internalKeysOnly: true,
                ktUserContext: await dispatch(getKTUserContext()),
            });

            const addressKey = await getVerifiedAddressKey(addressKeys, btc);

            return addressKey;
        },
        [api]
    );
};
