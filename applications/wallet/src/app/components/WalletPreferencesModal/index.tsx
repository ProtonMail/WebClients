import { ChangeEvent } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    ModalOwnProps,
} from '@proton/components/components';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal, Select, SelectOption } from '../../atoms';
import { BitcoinViaEmailNote } from '../../atoms/BitcoinViaEmailNote';
import { getBitcoinUnitOptions } from '../../utils';
import { AccountPreferences } from '../AccountPreferences';
import { WalletDeletionModal } from '../WalletDeletionModal';
import { useWalletPreferences } from './useWalletPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
}

export const WalletPreferencesModal = ({ wallet, otherWallets, ...modalProps }: Props) => {
    const {
        userWalletSettings,
        loadingUserWalletSettings,
        updateBitcoinUnit,

        walletName,
        setWalletName,
        loadingWalletNameUpdate,
        updateWalletName,
        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,
        openBackupModal,
        clearBrowserStorage,
    } = useWalletPreferences(wallet, () => {
        modalProps.onClose?.();
    });

    return (
        <>
            <Modal
                title={c('Wallet preference').t`Your wallet preferences`}
                enableCloseWhenClickOutside
                size="large"
                {...modalProps}
            >
                <div className="flex flex-column">
                    <InputFieldStackedGroup classname="mb-4">
                        <Input
                            label={c('Wallet preference').t`Name`}
                            placeholder={c('Wallet preference').t`My super wallet`}
                            value={walletName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setWalletName(e.target.value);
                            }}
                            onBlur={() => {
                                if (walletName) {
                                    updateWalletName();
                                }
                            }}
                            disabled={loadingWalletNameUpdate}
                            isGroupElement
                            prefix={
                                <div
                                    className="rounded-full flex p-3"
                                    style={{ background: 'var(--interaction-norm-minor-2)' }}
                                >
                                    <Icon name="wallet" style={{ color: 'var(--interaction-norm-major-1)' }}></Icon>
                                </div>
                            }
                        />

                        <Select
                            label={c('Wallet settings').t`Bitcoin unit`}
                            id="bitcoin-unit-selector"
                            aria-describedby="label-bitcoin-unit"
                            value={userWalletSettings?.BitcoinUnit}
                            disabled={loadingUserWalletSettings}
                            onChange={(event) => {
                                void updateBitcoinUnit(event.value);
                            }}
                            options={getBitcoinUnitOptions().map((option) => ({
                                label: option.label,
                                value: option.unit,
                                id: option.unit,
                                children: <SelectOption label={option.label} />,
                            }))}
                            renderSelected={(selected) => {
                                const option = getBitcoinUnitOptions().find((option) => option.unit === selected);
                                return option ? option.label : null;
                            }}
                            isGroupElement
                        />
                    </InputFieldStackedGroup>

                    <div className="flex flex-column my-3">
                        <span className="block color-weak">{c('Wallet preference').t`Accounts`}</span>

                        <BitcoinViaEmailNote
                            isActive={wallet.WalletAccounts.some((acc) => Boolean(acc.Addresses.length))}
                        />

                        {wallet.WalletAccounts.map((walletAccount, index) => {
                            return (
                                <div key={index}>
                                    <AccountPreferences
                                        key={walletAccount.ID}
                                        wallet={wallet}
                                        walletAccount={walletAccount}
                                        otherWallets={otherWallets}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <Collapsible>
                        <CollapsibleHeader
                            suffix={
                                <CollapsibleHeaderIconButton>
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            <div className="flex flex-row items-center color-weak">
                                <Icon name="cog-wheel" />
                                <div className="ml-1">{c('Wallet preference').t`Advanced options`}</div>
                            </div>
                        </CollapsibleHeader>
                        <CollapsibleContent>
                            <div className="flex flex-column items-center">
                                <Button
                                    fullWidth
                                    shape="solid"
                                    color="norm"
                                    className="mt-6"
                                    onClick={() => {
                                        openBackupModal();
                                    }}
                                >{c('Wallet preference').t`Back up wallet`}</Button>

                                <Button
                                    fullWidth
                                    shape="solid"
                                    color="danger"
                                    onClick={() => openWalletDeletionConfirmationModal()}
                                    className="mt-2"
                                >{c('Wallet preference').t`Delete wallet`}</Button>

                                <Button
                                    fullWidth
                                    shape="underline"
                                    color="weak"
                                    onClick={() => clearBrowserStorage()}
                                    className="mt-2"
                                >{c('Wallet preference').t`Clear browser storage`}</Button>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Modal>

            <WalletDeletionModal wallet={wallet} {...walletDeletionConfirmationModal} />
        </>
    );
};
