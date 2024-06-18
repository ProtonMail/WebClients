import { ChangeEvent } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    Info,
    ModalOwnProps,
} from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal, Select } from '../../atoms';
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
    } = useWalletPreferences(wallet);

    return (
        <>
            <Modal
                title={c('Wallet preference').t`Your wallet preferences`}
                enableCloseWhenClickOutside
                size="large"
                {...modalProps}
            >
                <div className="flex flex-column">
                    <div className="flex flex-column my-4 bg-weak rounded-xl">
                        <Input
                            label={c('Wallet preference').t`Wallet name`}
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
                        />

                        <Select
                            label={
                                <div className="flex flex-row">
                                    <span className="block mr-1">{c('Wallet settings').t`Bitcoin unit`}</span>
                                    <Info title={c('Wallet settings').t`Unit in which bitcoin will be displayed`} />
                                </div>
                            }
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
                            }))}
                        />
                    </div>

                    <div className="flex flex-column my-3">
                        <span className="block color-weak">{c('Wallet preference').t`Accounts`}</span>

                        {wallet.WalletAccounts.map((walletAccount) => {
                            return (
                                <AccountPreferences
                                    key={walletAccount.ID}
                                    wallet={wallet}
                                    walletAccount={walletAccount}
                                    otherWallets={otherWallets}
                                />
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
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Modal>

            <WalletDeletionModal wallet={wallet} {...walletDeletionConfirmationModal} />
        </>
    );
};
