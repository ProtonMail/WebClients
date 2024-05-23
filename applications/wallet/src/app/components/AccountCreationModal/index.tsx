import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmDerivationPath, WasmScriptType } from '@proton/andromeda';
import { Icon, Info, ModalOwnProps } from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import {
    IWasmApiWalletData,
    decryptWalletKey,
    encryptWalletDataWithWalletKey,
    useWalletApiClients,
    walletAccountCreation,
} from '@proton/wallet';

import { Button, CoreButton, Input, Modal, Select } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { getLabelByScriptType, isUndefined } from '../../utils';
import { getDefaultWalletAccountName } from '../../utils/wallet';

interface Props extends ModalOwnProps {
    apiWalletData: IWasmApiWalletData;
}

const DEFAULT_INDEX = 0;
const baseIndexOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'custom'];

const SCRIPT_TYPES: WasmScriptType[] = [
    WasmScriptType.Legacy,
    WasmScriptType.NestedSegwit,
    WasmScriptType.NativeSegwit,
    WasmScriptType.Taproot,
];

const purposeByScriptType: Record<WasmScriptType, number> = {
    [WasmScriptType.Legacy]: 44,
    [WasmScriptType.NestedSegwit]: 49,
    [WasmScriptType.NativeSegwit]: 84,
    [WasmScriptType.Taproot]: 86,
};

export const AccountCreationModal = ({ apiWalletData, ...modalProps }: Props) => {
    // TODO use different default if 0 is already added
    const [label, setLabel] = useState(getDefaultWalletAccountName(apiWalletData.WalletAccounts));

    const [selectedScriptType, setSelectedScriptType] = useState(WasmScriptType.NativeSegwit);

    const [selectedIndex, setSelectedIndex] = useState<string | number>(DEFAULT_INDEX);
    const [inputIndex, setInputIndex] = useState<number>(DEFAULT_INDEX);

    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [loading, withLoading] = useLoading();
    const { network } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();
    const [userKeys] = useUserKeys();
    const dispatch = useWalletDispatch();

    const api = useWalletApiClients();

    const indexesByScriptType = useMemo(() => {
        return apiWalletData.WalletAccounts.reduce((acc: Partial<Record<WasmScriptType, Set<number>>>, cur) => {
            const set = acc[cur.ScriptType as WasmScriptType] ?? new Set();

            // TODO: find a better to get index, maybe store on db side?
            const i = Number(cur.DerivationPath.split('/')[3]?.replace("'", '') ?? null);

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

    useEffect(() => {
        let index = 0;
        while (indexesByScriptType[selectedScriptType]?.has(index)) {
            index++;
        }
        setSelectedIndex(index);
        setInputIndex(index);
    }, [selectedScriptType, indexesByScriptType]);

    const onAccountCreation = async () => {
        const index = Number.isFinite(selectedIndex) ? (selectedIndex as number) : inputIndex;
        if (isUndefined(network) || !userKeys || indexesByScriptType[selectedScriptType]?.has(index)) {
            return;
        }

        const derivationPath = WasmDerivationPath.fromParts(purposeByScriptType[selectedScriptType], network, index);

        // Typeguard
        if (!apiWalletData.WalletKey?.WalletKey) {
            return;
        }

        const { WalletKey, Wallet } = apiWalletData;

        // TODO: maybe we should have this in a context
        const key = await decryptWalletKey(WalletKey.WalletKey, userKeys);
        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], key);

        // Typeguard
        if (!encryptedLabel) {
            return;
        }

        api.wallet
            .createWalletAccount(Wallet.ID, derivationPath, encryptedLabel, selectedScriptType)
            .then(async (createdAccount) => {
                createNotification({ text: c('Wallet Account').t`Your account was successfully created` });
                dispatch(walletAccountCreation({ walletID: Wallet.ID, account: createdAccount.Data }));
                modalProps.onClose?.();
            })
            .catch(() => {
                createNotification({ text: c('Wallet Account').t`Could not add account to wallet`, type: 'error' });
            });
    };

    return (
        <Modal
            title={c('Wallet Account').t`Add account`}
            subline={`Accounts in an on-chain Bitcoin wallet help distinguish various purposes, enhancing privacy and organization. \nYou can add accounts you want to monitor transactions and balances to see them in the ${WALLET_APP_NAME}.`}
            enableCloseWhenClickOutside
            {...modalProps}
        >
            <div className="flex flex-row">
                <Input
                    label={c('Wallet Account').t`Account label`}
                    id="account-label-input"
                    placeholder={c('Wallet Account').t`Savings for holiday`}
                    value={label}
                    disabled={loading}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setLabel(event.target.value);
                    }}
                />
            </div>

            {showAdvancedSettings ? (
                <>
                    <div className="flex flex-row mt-4">
                        <Select
                            label={
                                <div className="flex flex-row">
                                    <span className="block mr-1">{c('Wallet Account').t`Script Type`}</span>
                                    <Info
                                        title={c('Wallet Account')
                                            .t`Script type used in account. This will have an impact on account derivation path.`}
                                    />
                                </div>
                            }
                            id="account-script-type-selector"
                            aria-describedby="label-account-script-type"
                            value={selectedScriptType}
                            disabled={loading}
                            onChange={(event) => {
                                setSelectedScriptType(event.value);
                            }}
                            options={SCRIPT_TYPES.map((opt) => ({
                                label: getLabelByScriptType(opt as WasmScriptType),
                                value: opt,
                                id: opt.toString(),
                            }))}
                        />
                    </div>

                    <div className="flex flex-row mt-2">
                        <div className="grow">
                            {/* TODO: filter out already added accounts */}
                            <Select
                                label={
                                    <div className="flex flex-row">
                                        <span className="block mr-1">{c('Wallet Account').t`Index`}</span>
                                        <Info title={c('Wallet Account').t`Index of the account to add`} />
                                    </div>
                                }
                                id="account-index-selector"
                                aria-describedby="label-account-index"
                                value={baseIndexOptions.includes(selectedIndex) ? selectedIndex : 'custom'}
                                disabled={loading}
                                onChange={(event) => {
                                    setSelectedIndex(event.value);
                                }}
                                options={baseIndexOptions.map((index) => ({
                                    label: index.toString(),
                                    value: index,
                                    id: index.toString(),
                                    disabled: indexesByScriptType[selectedScriptType]?.has(Number(index)),
                                }))}
                            />
                        </div>

                        {!Number.isInteger(selectedIndex) && (
                            <div className="ml-2">
                                <Input
                                    label={c('Wallet Account').t`Custom account index`}
                                    id="custom-account-index-input"
                                    placeholder={c('Wallet Account').t`Custom index`}
                                    value={inputIndex}
                                    min={0}
                                    type="number"
                                    disabled={loading}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setInputIndex(Number(event.target.value));
                                    }}
                                    error={
                                        indexesByScriptType[selectedScriptType]?.has(inputIndex) &&
                                        c('Wallet account').t`This account is already created`
                                    }
                                />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div>
                    <CoreButton
                        shape="ghost"
                        size="small"
                        className="color-hint mt-4"
                        onClick={() => setShowAdvancedSettings(true)}
                    >
                        {c('Wallet transaction').t`View advanced settings`} <Icon name="chevron-down" size={3} />
                    </CoreButton>
                </div>
            )}

            <div className="mt-4 flex flex-col">
                <Button
                    disabled={loading}
                    pill
                    fullWidth
                    className="mt-2"
                    shape="solid"
                    color="norm"
                    onClick={() => withLoading(onAccountCreation())}
                >{c('Wallet Account').t`Add`}</Button>
                <Button
                    disabled={loading}
                    pill
                    fullWidth
                    shape="ghost"
                    color="weak"
                    onClick={() => modalProps.onClose?.()}
                >{c('Wallet Account').t`Cancel`}</Button>
            </div>
        </Modal>
    );
};
