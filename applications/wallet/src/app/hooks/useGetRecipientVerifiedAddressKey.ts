import { useCallback } from 'react';

import { useApi } from '@proton/components';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { CryptoProxy, type PublicKeyReference } from '@proton/crypto/lib';
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
    const keys = btc
        ? await Promise.allSettled(
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
          )
        : keysAbleToVerify;

    const [firstAddressKey] = keys
        .map((result) => ('value' in result ? result.value : undefined))
        .filter((key): key is PublicKeyReference => !!key);

    return firstAddressKey;
};

export const useGetRecipientVerifiedAddressKey = () => {
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const api = useApi();

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
                verifyOutboundPublicKeys,
            });

            const addressKey = await getVerifiedAddressKey(addressKeys, btc);

            return addressKey;
        },
        [api, verifyOutboundPublicKeys]
    );
};
