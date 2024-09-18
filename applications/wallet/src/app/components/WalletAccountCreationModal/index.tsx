import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import last from 'lodash/last';
import { c } from 'ttag';

import { WasmDerivationPath, WasmScriptType } from '@proton/andromeda';
import { Href } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    Tooltip,
} from '@proton/components';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { IWasmApiWalletData } from '@proton/wallet';
import {
    BASE_INDEX_OPTIONS,
    DEFAULT_INDEX,
    SCRIPT_TYPES,
    decryptWalletAccount,
    encryptWalletDataWithWalletKey,
    getDefaultWalletAccountName,
    useWalletApiClients,
} from '@proton/wallet';
import { useWalletDispatch, walletAccountCreation } from '@proton/wallet/store';

import { Button, CoreButtonLike, Input, Modal, Select } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { ModalSectionHeader } from '../../atoms/ModalSection';
import { useBitcoinBlockchainContext } from '../../contexts';
import type { SubTheme } from '../../utils';
import { getDescriptionByScriptType, getLabelByScriptType, isUndefined } from '../../utils';

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

        const derivationPath = WasmDerivationPath.fromParts(selectedScriptType, network, index);

        const { Wallet, WalletKey } = apiWalletData;

        if (!WalletKey?.DecryptedKey) {
            return;
        }

        const [encryptedLabel] = await encryptWalletDataWithWalletKey([label], WalletKey.DecryptedKey);

        // Typeguard
        if (!encryptedLabel) {
            return;
        }

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
            modalProps.onClose?.();
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Wallet Account').t`Could not add account to wallet`,
                type: 'error',
            });
        }
    };

    return (
        <Modal title={c('Wallet Account').t`Add wallet account`} className={theme} {...modalProps}>
            <ModalParagraph>
                <p>{c('Wallet Account')
                    .t`Create multiple wallet accounts to separate your financial activities for better privacy and organization.`}</p>
                <p>{c('Wallet Account')
                    .t`If you want to receive Bitcoin via Email with multiple email addresses, then you need to create a wallet account for each email.`}</p>
            </ModalParagraph>

            <Input
                label={c('Wallet Account').t`Name`}
                id="account-label-input"
                placeholder={c('Wallet Account').t`Savings for holiday`}
                value={label}
                disabled={loading}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setLabel(event.target.value);
                }}
            />

            <Collapsible className="my-2">
                <CollapsibleHeader
                    className="color-weak"
                    suffix={
                        <CollapsibleHeaderIconButton className="color-weak">
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >{c('Wallet account').t`Advanced settings`}</CollapsibleHeader>
                <CollapsibleContent>
                    <div className="flex flex-column items-center">
                        <ModalSectionHeader header={c('Wallet account').t`Address Type`}>
                            {c('Wallet account')
                                .t`We default to Native Segwit, which has the lowest network fees. You can change this to receive bitcoin from other services that only support other types.`}
                        </ModalSectionHeader>
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
                                    <div className="flex flex-row items-center py-2">
                                        {getLabelByScriptType(opt as WasmScriptType)}
                                        <Tooltip title={getDescriptionByScriptType(opt as WasmScriptType)}>
                                            <Icon name="info-circle" className="ml-auto color-hint" />
                                        </Tooltip>
                                    </div>
                                ),
                            }))}
                            renderSelected={(selected) => getLabelByScriptType(selected as WasmScriptType)}
                        />

                        <CoreButtonLike
                            className="my-3 mr-auto"
                            shape="underline"
                            color="norm"
                            as={Href}
                            href={getKnowledgeBaseUrl('/wallet-create-btc-account#bitcoin-address-type')}
                        >{c('Action').t`Learn more`}</CoreButtonLike>
                    </div>

                    <div className="flex flex-column items-center">
                        <ModalSectionHeader header={c('Wallet account').t`Account Index`}>
                            {c('Wallet account')
                                .t`We default to the next unused index. You can change this to recover or to skip a previous account.`}
                        </ModalSectionHeader>
                        <div className="flex flex-row mt-2 w-full">
                            <div className="grow">
                                <Select
                                    label={
                                        <div className="flex flex-row">
                                            <span className="block mr-1">{c('Wallet Account').t`Account index`}</span>
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

                        <CoreButtonLike
                            className="my-3 mr-auto"
                            shape="underline"
                            color="norm"
                            as={Href}
                            href={getKnowledgeBaseUrl('/wallet-create-btc-account#bitcoin-address-index-type')}
                        >{c('Action').t`Learn more`}</CoreButtonLike>
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
                >{c('Wallet Account').t`Create wallet account`}</Button>
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
