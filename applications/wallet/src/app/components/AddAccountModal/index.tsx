import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { Info, ModalTwo, Option, SelectTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useEventManager, useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { WasmDerivationPath, WasmScriptType } from '../../../pkg';
import { useRustApi } from '../../contexts';
import { useBitcoinNetwork } from '../../store/hooks';
import { IWasmWallet } from '../../types';
import { getLabelByScriptType } from '../../utils';
import { decryptWalletKey, encryptWalletDataWithWalletKey } from '../../utils/crypto';

interface Props {
    wallet: IWasmWallet;
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_INDEX = 0;
const baseIndexOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'custom'];

const SCRIPT_TYPES = [
    WasmScriptType.Legacy,
    WasmScriptType.NestedSegwit,
    WasmScriptType.NativeSegwit,
    WasmScriptType.Taproot,
];

const purposeByScriptType: Record<WasmScriptType, number> = {
    [WasmScriptType.Legacy]: 44,
    [WasmScriptType.NestedSegwit]: 48,
    [WasmScriptType.NativeSegwit]: 84,
    [WasmScriptType.Taproot]: 86,
};

export const AddAccountModal = ({ wallet, isOpen, onClose }: Props) => {
    // TODO use different default if 0 is already added
    const [label, setLabel] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<string | number>(DEFAULT_INDEX);
    const [inputIndex, setInputIndex] = useState<number>(DEFAULT_INDEX);
    const [loading, withLoading] = useLoading();
    const [network] = useBitcoinNetwork();
    const { createNotification } = useNotifications();
    const [userKeys] = useUserKeys();
    const { call } = useEventManager();

    const api = useRustApi();

    const [selectedScriptType, setSelectedScriptType] = useState(WasmScriptType.NativeSegwit);

    const onAccountCreation = async () => {
        if (!network || !userKeys) {
            return;
        }

        const derivationPath = WasmDerivationPath.fromParts(
            purposeByScriptType[selectedScriptType],
            network,
            Number.isFinite(selectedIndex) ? (selectedIndex as number) : inputIndex
        );

        // TODO: maybe we should have this in a context
        const key = await decryptWalletKey(wallet.WalletKey.WalletKey, userKeys);
        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], key);

        // Typeguard
        if (!encryptedLabel) {
            return;
        }

        await api
            .wallet()
            .createWalletAccount(wallet.Wallet.ID, derivationPath, encryptedLabel, selectedScriptType)
            .then(async () => {
                await call();
                createNotification({ text: c('Wallet Account').t`Your account was successfully created` });
                onClose();
            })
            .catch(() => {
                createNotification({ text: c('Wallet Account').t`Could not add account to wallet`, type: 'error' });
            });
    };

    return (
        <ModalTwo className="p-0" open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Wallet Account').t`Add account`} />
            <ModalContent>
                <p className="text-sm color-hint text-justify mt-2 mb-6">
                    {c('Wallet Account')
                        .t`Accounts in an on-chain Bitcoin wallet help distinguish various purposes, enhancing privacy and organization. You can add accounts you want to monitor transactions and balances to see them in the ${WALLET_APP_NAME}.`}
                </p>
                <div className="flex flex-row">
                    <label className="w-1/4 mr-2 text-semibold block mt-2" htmlFor="account-label-input">
                        <span>{c('Wallet Account').t`Label`}</span>
                    </label>

                    <div className="w-2/4">
                        <Input
                            id="account-label-input"
                            placeholder={c('Wallet Account').t`Account label`}
                            value={label}
                            disabled={loading}
                            onChange={(event) => {
                                setLabel(event.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-row mt-2">
                    <label
                        className="w-1/4 mr-2 text-semibold block mt-2"
                        id="label-account-script-type"
                        htmlFor="account-script-type-selector"
                    >
                        <span className="mr-2">{c('Wallet Account').t`Script Type`}</span>
                        <Info
                            title={c('Wallet Account')
                                .t`Script type used in account. This will have an impact on account derivation path.`}
                        />
                    </label>

                    <div className="w-2/4">
                        <SelectTwo
                            id="account-script-type-selector"
                            aria-describedby="label-account-script-type"
                            value={selectedScriptType}
                            disabled={loading}
                            onChange={(event) => {
                                setSelectedScriptType(event.value);
                            }}
                        >
                            {SCRIPT_TYPES.map((scriptType) => {
                                return (
                                    <Option
                                        title={getLabelByScriptType(scriptType as WasmScriptType)}
                                        value={scriptType}
                                        key={scriptType}
                                    />
                                );
                            })}
                        </SelectTwo>
                    </div>
                </div>

                <div className="flex flex-row mt-2">
                    <label
                        className="w-1/4 mr-2 text-semibold block mt-2"
                        id="label-account-index"
                        htmlFor="account-index-selector"
                    >
                        <span className="mr-2">{c('Wallet Account').t`Index`}</span>
                        <Info title={c('Wallet Account').t`Index of the account to add`} />
                    </label>

                    <div className="w-1/4 mr-2">
                        <SelectTwo
                            id="account-index-selector"
                            aria-describedby="label-account-index"
                            value={baseIndexOptions.includes(selectedIndex) ? selectedIndex : 'custom'}
                            disabled={loading}
                            onChange={(event) => {
                                setSelectedIndex(event.value);
                            }}
                        >
                            {/* TODO: filter out already added accounts */}
                            {baseIndexOptions.map((index) => (
                                <Option title={String(index)} value={index} key={index} />
                            ))}
                        </SelectTwo>
                    </div>

                    {!Number.isInteger(selectedIndex) && (
                        <div className="w-1/4">
                            <label className="sr-only" htmlFor="custom-account-index-input">
                                {c('Wallet Account').t`Custom account index`}
                            </label>
                            <Input
                                id="custom-account-index-input"
                                placeholder={c('Wallet Account').t`Custom index`}
                                value={inputIndex}
                                min={0}
                                type="number"
                                disabled={loading}
                                onChange={(event) => {
                                    setInputIndex(Number(event.target.value));
                                }}
                            />
                        </div>
                    )}
                </div>
            </ModalContent>

            <ModalTwoFooter>
                <Button disabled={loading} className="ml-auto">{c('Wallet Account').t`Cancel`}</Button>
                <Button
                    loading={loading}
                    className="ml-3"
                    color="norm"
                    onClick={() => withLoading(onAccountCreation())}
                >{c('Wallet Account').t`Add`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
