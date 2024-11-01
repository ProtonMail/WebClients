import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

import last from 'lodash/last';
import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import { WasmDerivationPath, WasmScriptType } from '@proton/andromeda';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IWasmApiWalletData } from '@proton/wallet';
import {
    DEFAULT_INDEX,
    decryptWalletAccount,
    encryptWalletDataWithWalletKey,
    getDefaultWalletAccountName,
    useWalletApiClients,
} from '@proton/wallet';
import { useWalletDispatch, walletAccountCreation } from '@proton/wallet/store';

import { useBitcoinBlockchainContext } from '../../contexts';
import { isUndefined } from '../../utils';

export const useWalletAccountCreationModal = (apiWalletData: IWasmApiWalletData, onClose?: () => void) => {
    const [label, setLabel] = useState(getDefaultWalletAccountName(apiWalletData.WalletAccounts));
    const [selectedScriptType, setSelectedScriptType] = useState(WasmScriptType.NativeSegwit);

    const [selectedIndex, setSelectedIndex] = useState<string | number>(DEFAULT_INDEX);
    const [inputIndex, setInputIndex] = useState<number>(DEFAULT_INDEX);
    const indexValue = Number.isFinite(selectedIndex) ? (selectedIndex as number) : inputIndex;

    const { network } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();
    const [userKeys] = useUserKeys();
    const dispatch = useWalletDispatch();

    const api = useWalletApiClients();

    const indexesByScriptType = useMemo(() => {
        return apiWalletData.WalletAccounts.reduce((acc: Partial<Record<WasmScriptType, Set<number>>>, cur) => {
            const set = acc[cur.ScriptType as WasmScriptType] ?? new Set();

            const derivationPathByPart = cur.DerivationPath.split('/');
            const indexPart = last(derivationPathByPart);
            const unhardenedIndexStr = indexPart?.replace("'", '');

            // TODO: find a better way to get index, maybe store on db side?
            const i = Number(unhardenedIndexStr);

            if (!Number.isFinite(i)) {
                return acc;
            }

            set.add(i);
            return {
                ...acc,
                [cur.ScriptType as WasmScriptType]: set,
            };
        }, {});
    }, [apiWalletData.WalletAccounts]);

    // Effect to select a different index if 0 is already used
    useEffect(() => {
        let index = 0;
        while (indexesByScriptType[selectedScriptType]?.has(index)) {
            index++;
        }

        // selectedIndex is already used on new script type, we change it to first unused
        if (indexesByScriptType[selectedScriptType]?.has(indexValue)) {
            setSelectedIndex(index);
            setInputIndex(index);
        }
    }, [selectedScriptType, indexesByScriptType, indexValue]);

    const createWalletAccount = async () => {
        if (isUndefined(network) || !userKeys || indexesByScriptType[selectedScriptType]?.has(indexValue)) {
            return;
        }

        const derivationPath = WasmDerivationPath.fromParts(selectedScriptType, network, indexValue);

        const { Wallet, WalletKey } = apiWalletData;

        if (!WalletKey?.DecryptedKey) {
            return;
        }

        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], WalletKey.DecryptedKey);

        try {
            const createdAccount = await api.wallet.createWalletAccount(
                Wallet.ID,
                derivationPath,
                encryptedLabel,
                selectedScriptType
            );

            createNotification({ text: c('Wallet Account').t`Your account was successfully created` });

            const decryptedAccount = await decryptWalletAccount({
                walletKey: WalletKey.DecryptedKey,
                walletAccount: createdAccount.Data,
            });

            dispatch(walletAccountCreation(decryptedAccount));
            onClose?.();
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Wallet Account').t`Error adding account to wallet. Please try again.`,
                type: 'error',
            });
        }
    };

    const onLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLabel(event.target.value);
    };

    const onIndexSelect = (event: SelectChangeEvent<string | number>) => {
        setSelectedIndex(event.value);
    };

    const onIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (Number.isFinite(value)) {
            setInputIndex(value);
        }
    };

    const onScriptTypeSelect = (event: SelectChangeEvent<WasmScriptType>) => {
        setSelectedScriptType(event.value);
    };

    return {
        label,
        onLabelChange,

        selectedIndex,
        onIndexSelect,
        inputIndex,
        onIndexChange,

        indexesByScriptType,
        selectedScriptType,
        onScriptTypeSelect,

        createWalletAccount,
    };
};
