import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal, Select, SelectOption } from '../../atoms';
import type { SubTheme } from '../../utils';
import { getBitcoinUnitOptions } from '../../utils';
import { AccountPreferences } from '../AccountPreferences';
import { WalletDeletionModal } from '../WalletDeletionModal';
import { useWalletPreferences } from './useWalletPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
    theme?: SubTheme;
}

export const WalletPreferencesModal = ({ wallet, otherWallets, theme, ...modalProps }: Props) => {
    const {
        userWalletSettings,
        loadingUserWalletSettings,
        updateBitcoinUnit,

        walletName,
        setWalletName,
        loadingWalletNameUpdate,
        updateWalletName,
        shouldShowBvEWarningByAccountId,
        walletDeletionConfirmationModal,
        openWalletDeletionConfirmationModal,
        openBackupModal,
        clearBrowserStorage,
    } = useWalletPreferences(wallet, () => {
        modalProps.onClose?.();
    });

    return (
        <>
            <Modal title={c('Wallet preference').t`Wallet preferences`} size="medium" className={theme} {...modalProps}>
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

                    <div className="flex flex-column mb-3">
                        <span className="block color-weak mb-3">{c('Wallet preference').t`Accounts`}</span>
                        <div className="flex flex-column gap-4">
                            {wallet.WalletAccounts.map((walletAccount, index) => {
                                return (
                                    <div key={index}>
                                        <AccountPreferences
                                            key={walletAccount.ID}
                                            wallet={wallet}
                                            walletAccount={walletAccount}
                                            otherWallets={otherWallets}
                                            shouldShowBvEWarning={Boolean(
                                                shouldShowBvEWarningByAccountId[walletAccount.ID]
                                            )}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Collapsible>
                        <CollapsibleHeader
                            className="color-weak"
                            suffix={
                                <CollapsibleHeaderIconButton className="color-weak">
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            {c('Wallet preference').t`View more`}
                        </CollapsibleHeader>
                        <CollapsibleContent>
                            <div className="flex flex-column items-center gap-2 mt-6">
                                <Button
                                    fullWidth
                                    shape="solid"
                                    color="norm"
                                    onClick={() => {
                                        openBackupModal();
                                    }}
                                >{c('Wallet preference').t`View wallet seed phrase`}</Button>

                                <Button
                                    fullWidth
                                    shape="solid"
                                    color="danger"
                                    onClick={() => openWalletDeletionConfirmationModal()}
                                >{c('Wallet preference').t`Delete wallet`}</Button>

                                <Button fullWidth shape="ghost" color="weak" onClick={() => clearBrowserStorage()}>{c(
                                    'Wallet preference'
                                ).t`Clear browser storage`}</Button>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Modal>

            <WalletDeletionModal wallet={wallet} {...walletDeletionConfirmationModal} />
        </>
    );
};
