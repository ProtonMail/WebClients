import { useEffect } from 'react';

import {
    WasmAccount,
    WasmApiWallet,
    WasmApiWalletAccount,
    WasmDerivationPath,
    WasmMnemonic,
    WasmNetwork,
    WasmWallet,
    WasmWordCount,
} from '@proton/andromeda';
import { useGetAddresses } from '@proton/components/hooks/useAddresses';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useGetOrganization } from '@proton/components/hooks/useOrganization';
import { useUser } from '@proton/components/hooks/useUser';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys';

import { WalletType, useGetUserWalletSettings, useWalletApiClients } from '..';
import { DEFAULT_ACCOUNT_LABEL, DEFAULT_SCRIPT_TYPE, FIRST_INDEX, PURPOSE_BY_SCRIPT_TYPE } from '../constants/bitcoin';
import { useGetBitcoinNetwork } from '../store/hooks/useBitcoinNetwork';
import {
    POOL_FILLING_THRESHOLD,
    encryptWalletData,
    generateBitcoinAddressesPayloadForPoolFilling,
    getDefaultWalletName,
} from '../utils';

// Flag to tell the API the wallet was autocreated
const WALLET_AUTOCREATE_FLAG = true;

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
    const getOrganization = useGetOrganization();
    const getUserWalletSettings = useGetUserWalletSettings();
    const getAddresses = useGetAddresses();

    const [user] = useUser();
    const authentication = useAuthentication();

    const walletApi = useWalletApiClients();

    const enableBitcoinViaEmail = async ({
        wallet,
        walletAccount,
        wasmWallet,
        derivationPathParts,
    }: {
        wallet: WasmApiWallet;
        walletAccount: WasmApiWalletAccount;
        wasmWallet: WasmWallet;
        derivationPathParts: readonly [number, WasmNetwork, 0];
    }) => {
        const addresses = await getAddresses();
        const userKeys = await getUserKeys();

        const wasmAccount = new WasmAccount(
            wasmWallet,
            DEFAULT_SCRIPT_TYPE,
            WasmDerivationPath.fromParts(...derivationPathParts)
        );

        const [primaryAddress] = addresses;
        const [primaryAddressKey] = await getDecryptedAddressKeysHelper(
            primaryAddress.Keys,
            user,
            userKeys,
            authentication.getPassword()
        );

        await walletApi.wallet.addEmailAddress(wallet.ID, walletAccount.ID, primaryAddress.ID);

        // Fill bitcoin address pool
        const addressesPoolPayload = await generateBitcoinAddressesPayloadForPoolFilling({
            addressesToCreate: POOL_FILLING_THRESHOLD,
            startIndex: FIRST_INDEX,
            wasmAccount,
            addressKey: primaryAddressKey,
        });

        if (addressesPoolPayload?.[0]?.length) {
            await walletApi.bitcoin_address.addBitcoinAddress(wallet.ID, walletAccount.ID, addressesPoolPayload);
        }
    };

    const setupWalletAccount = async ({
        wallet,
        label,
        derivationPathParts,
    }: {
        wallet: WasmApiWallet;
        label: string;
        derivationPathParts: readonly [number, WasmNetwork, 0];
    }) => {
        const userWalletSettings = await getUserWalletSettings();

        const account = await walletApi.wallet.createWalletAccount(
            wallet.ID,
            WasmDerivationPath.fromParts(...derivationPathParts),
            label,
            DEFAULT_SCRIPT_TYPE
        );

        await walletApi.wallet.updateWalletAccountFiatCurrency(
            wallet.ID,
            account.Data.ID,
            userWalletSettings.FiatCurrency
        );

        return account;
    };

    const autoCreateWallet = async () => {
        const userKeys = await getUserKeys();
        const network = await getBitcoinNetwork();

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

        const derivationPathParts = [PURPOSE_BY_SCRIPT_TYPE[DEFAULT_SCRIPT_TYPE], network, FIRST_INDEX] as const;

        try {
            const { Wallet } = await walletApi.wallet.createWallet(
                encryptedName,
                false,
                WalletType.OnChain,
                hasPassphrase,
                userKeyId,
                walletKey,
                walletKeySignature,
                encryptedMnemonic,
                fingerprint,
                undefined,
                WALLET_AUTOCREATE_FLAG
            );

            const account = await setupWalletAccount({
                wallet: Wallet,
                label: encryptedFirstAccountLabel,
                derivationPathParts,
            });

            await enableBitcoinViaEmail({
                wallet: Wallet,
                walletAccount: account.Data,
                wasmWallet,
                derivationPathParts,
            });
        } catch (e) {
            console.error('Could not autocreate wallet from Mail', e);
        }
    };

    const shouldCreateWallet = async () => {
        if (!higherLevelPilot) {
            return false;
        }

        let isUserCompatible = user.isFree;

        if (!isUserCompatible) {
            const organization = await getOrganization();
            isUserCompatible = organization?.MaxMembers === 1;
        }

        if (!isUserCompatible) {
            return false;
        }

        const userWalletSettings = await getUserWalletSettings();
        return !userWalletSettings.WalletCreated;
    };

    useEffect(() => {
        const run = async () => {
            if (await shouldCreateWallet()) {
                await autoCreateWallet();
            }
        };

        void run();
    }, []);
};
