import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmDerivationPath, WasmScriptType } from '@proton/andromeda';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    Info,
    ModalOwnProps,
} from '@proton/components/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    BASE_INDEX_OPTIONS,
    DEFAULT_INDEX,
    IWasmApiWalletData,
    PURPOSE_BY_SCRIPT_TYPE,
    SCRIPT_TYPES,
    encryptWalletDataWithWalletKey,
    getDefaultWalletAccountName,
    useWalletApiClients,
    walletAccountCreation,
} from '@proton/wallet';

import { Button, CoreButton, Input, Modal, Select, SelectOption } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { SubTheme, getDescriptionByScriptType, getLabelByScriptType, isUndefined } from '../../utils';

export interface WalletAccountCreationModalOwnProps {
    apiWalletData: IWasmApiWalletData;
    theme?: SubTheme;
}

type Props = ModalOwnProps & WalletAccountCreationModalOwnProps;

export const WalletAccountCreationModal = ({ apiWalletData, theme, ...modalProps }: Props) => {
    // TODO use different default if 0 is already added
    const [label, setLabel] = useState(getDefaultWalletAccountName(apiWalletData.WalletAccounts));

    const [selectedScriptType, setSelectedScriptType] = useState(WasmScriptType.NativeSegwit);

    const [selectedIndex, setSelectedIndex] = useState<string | number>(DEFAULT_INDEX);
    const [inputIndex, setInputIndex] = useState<number>(DEFAULT_INDEX);

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

        const derivationPath = WasmDerivationPath.fromParts(PURPOSE_BY_SCRIPT_TYPE[selectedScriptType], network, index);

        const { Wallet, WalletKey } = apiWalletData;

        if (!WalletKey?.DecryptedKey) {
            return;
        }

        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], WalletKey.DecryptedKey);

        // Typeguard
        if (!encryptedLabel) {
            return;
        }

        await api.wallet
            .createWalletAccount(Wallet.ID, derivationPath, encryptedLabel, selectedScriptType)
            .then(async (createdAccount) => {
                createNotification({ text: c('Wallet Account').t`Your account was successfully created` });
                dispatch(walletAccountCreation(createdAccount.Data));
                modalProps.onClose?.();
            })
            .catch(() => {
                createNotification({ text: c('Wallet Account').t`Could not add account to wallet`, type: 'error' });
            });
    };

    return (
        <Modal
            title={c('Wallet Account').t`Add wallet account`}
            enableCloseWhenClickOutside
            className={theme}
            {...modalProps}
        >
            <div className="flex flex-row gap-2 mb-6 text-center color-weak">
                <p className="my-0">{c('Wallet Account')
                    .t`Create multiple wallet accounts to separate your financial activities for better privacy and organization.`}</p>
                <p className="my-0">{c('Wallet Account')
                    .t`If you want to receive Bitcoin via Email with multiple email addresses, then you need to create a wallet account for each email.`}</p>
            </div>

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

            <Collapsible className="my-6">
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >{c('Wallet account').t`View advanced settings`}</CollapsibleHeader>
                <CollapsibleContent>
                    <div className="flex flex-column items-center">
                        <h3 className="text-center mt-6 mb-2 text-semibold">{c('Wallet account').t`Address Type`}</h3>
                        <p className="mt-2 mb-6 color-weak text-center">{c('Wallet account')
                            .t`We default to Native Segwit, which has the lowest network fees. You can change this to receive bitcoin from other services that only support other types.`}</p>

                        <div className="flex flex-row mt-4 w-full">
                            <Select
                                label={c('Wallet Account').t`Address type`}
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
                                    children: (
                                        <SelectOption
                                            label={getLabelByScriptType(opt as WasmScriptType)}
                                            description={getDescriptionByScriptType(opt as WasmScriptType)}
                                        />
                                    ),
                                }))}
                                renderSelected={(selected) => getLabelByScriptType(selected as WasmScriptType)}
                            />
                        </div>

                        <CoreButton className="my-3 mr-auto" shape="underline" color="norm">{c('Wallet account')
                            .t`Learn more`}</CoreButton>
                    </div>

                    <div className="flex flex-column items-center">
                        <h3 className="text-center mt-6 mb-2 text-semibold">{c('Wallet account').t`Account Index`}</h3>
                        <p className="mt-2 mb-6 color-weak text-center">{c('Wallet account')
                            .t`We default to the next unused index. You can change this to recover or to skip a previous account.`}</p>

                        <div className="flex flex-row mt-2 w-full">
                            <div className="grow">
                                <Select
                                    label={
                                        <div className="flex flex-row">
                                            <span className="block mr-1">{c('Wallet Account').t`Index`}</span>
                                            <Info title={c('Wallet Account').t`Index of the account to add`} />
                                        </div>
                                    }
                                    id="account-index-selector"
                                    aria-describedby="label-account-index"
                                    value={BASE_INDEX_OPTIONS.includes(selectedIndex) ? selectedIndex : 'custom'}
                                    disabled={loading}
                                    onChange={(event) => {
                                        setSelectedIndex(event.value);
                                    }}
                                    options={BASE_INDEX_OPTIONS.map((index) => ({
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

                        <CoreButton className="my-3 mr-auto" shape="underline" color="norm">{c('Wallet account')
                            .t`Learn more`}</CoreButton>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <div className="mt-4 flex flex-col">
                <Button
                    disabled={loading}
                    fullWidth
                    className="mt-2"
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        void withLoading(onAccountCreation());
                    }}
                >{c('Wallet Account').t`Add`}</Button>
                <Button
                    disabled={loading}
                    fullWidth
                    shape="ghost"
                    color="weak"
                    onClick={() => modalProps.onClose?.()}
                    className="mt-2"
                >{c('Wallet Account').t`Cancel`}</Button>
            </div>
        </Modal>
    );
};
