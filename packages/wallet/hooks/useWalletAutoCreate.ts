import { useEffect } from 'react';

import { WasmAccount, WasmDerivationPath, WasmMnemonic, WasmWallet, WasmWordCount } from '@proton/andromeda';
import { useGetAddresses } from '@proton/components/hooks/useAddresses';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useUser } from '@proton/components/hooks/useUser';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys';

import { WalletType, useGetUserWalletSettings, useWalletApiClients } from '..';
import { DEFAULT_ACCOUNT_LABEL, DEFAULT_SCRIPT_TYPE, FIRST_INDEX, purposeByScriptType } from '../constants/bitcoin';
import { useGetBitcoinNetwork } from '../store/hooks/useBitcoinNetwork';
import {
    POOL_FILLING_THRESHOLD,
    encryptWalletData,
    generateBitcoinAddressesPayloadForPoolFilling,
    getDefaultWalletName,
} from '../utils';

/**
 * Utility hook creating a wallet if user don't have any
 *
 * Requiremenents
 * - this hook needs to be called inside ExtendedApiContext (see @proton/wallet/contexts/ExtendedApiContext)
 * - this hook need to be called inside a Redux context which walletReducers (see @proton/wallet/store/slices/index.ts)
 *
 * Note:
 * - For now we create a new wallet for any user without one. Later a field will be introduced by the API so that we can filter only user that never had a wallet
 */
export const useWalletAutoCreate = ({ higherLevelPilot = true }: { higherLevelPilot?: boolean } = {}) => {
    const getUserKeys = useGetUserKeys();
    const getBitcoinNetwork = useGetBitcoinNetwork();
    const getUserWalletSettings = useGetUserWalletSettings();
    const getAddresses = useGetAddresses();
    const [user] = useUser();
    const authentication = useAuthentication();

    const walletApi = useWalletApiClients();

    const autoCreateWallet = async () => {
        const userKeys = await getUserKeys();
        const network = await getBitcoinNetwork();
        const userWalletSettings = await getUserWalletSettings();
        const addresses = await getAddresses();

        const [primaryUserKey] = userKeys;

        const mnemonic = new WasmMnemonic(WasmWordCount.Words12).asString();
        const hasPassphrase = false;

        const compelledWalletName = getDefaultWalletName(false, []);

        // Encrypt wallet data
        const [
            [encryptedName, encryptedMnemonic, encryptedFirstAccountLabel],
            [walletKey, walletKeySignature, userKeyId],
        ] = await encryptWalletData([compelledWalletName, mnemonic, DEFAULT_ACCOUNT_LABEL], primaryUserKey);

        const wasmWallet = new WasmWallet(network, mnemonic, '');
        const fingerprint = wasmWallet.getFingerprint();

        if (!encryptedName) {
            return;
        }

        await walletApi.wallet
            .createWallet(
                encryptedName,
                false,
                WalletType.OnChain,
                hasPassphrase,
                userKeyId,
                walletKey,
                walletKeySignature,
                encryptedMnemonic,
                fingerprint,
                undefined
            )
            .then(async ({ Wallet }) => {
                const derivationPath = WasmDerivationPath.fromParts(
                    purposeByScriptType[DEFAULT_SCRIPT_TYPE],
                    network,
                    FIRST_INDEX
                );

                try {
                    const account = await walletApi.wallet.createWalletAccount(
                        Wallet.ID,
                        derivationPath,
                        encryptedFirstAccountLabel,
                        DEFAULT_SCRIPT_TYPE
                    );

                    const wasmAccount = new WasmAccount(wasmWallet, DEFAULT_SCRIPT_TYPE, derivationPath);

                    await walletApi.wallet.updateWalletAccountFiatCurrency(
                        Wallet.ID,
                        account.Data.ID,
                        userWalletSettings.FiatCurrency
                    );

                    const [primaryAddress] = addresses;
                    const [primaryAddressKey] = await getDecryptedAddressKeysHelper(
                        primaryAddress.Keys,
                        user,
                        userKeys,
                        authentication.getPassword()
                    );

                    await walletApi.wallet.addEmailAddress(Wallet.ID, account.Data.ID, primaryAddress.ID);

                    // Fill bitcoin address pool
                    const addressesPoolPayload = await generateBitcoinAddressesPayloadForPoolFilling({
                        addressesToCreate: POOL_FILLING_THRESHOLD,
                        startIndex: FIRST_INDEX,
                        wasmAccount,
                        addressKey: primaryAddressKey,
                    });

                    if (addressesPoolPayload?.[0]?.length) {
                        await walletApi.bitcoin_address.addBitcoinAddress(
                            Wallet.ID,
                            account.Data.ID,
                            addressesPoolPayload
                        );
                    }
                } catch (e) {
                    console.error('Could not autocreate wallet from Mail', e);
                }
            });
    };

    const shouldCreateWallet = async () => {
        const wallets = await walletApi.wallet.getWallets();
        return !wallets[0].length;
    };

    useEffect(() => {
        const run = async () => {
            if (higherLevelPilot && (await shouldCreateWallet())) {
                await autoCreateWallet();
            }
        };

        void run();
    }, []);
};
