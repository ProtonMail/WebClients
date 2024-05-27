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
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { AccountPreferences } from '../AccountPreferences';
import { WalletDeletionModal } from '../WalletDeletionModal';
import { useWalletPreferences } from './useWalletPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
}

export const WalletPreferencesModal = ({ wallet, otherWallets, ...modalProps }: Props) => {
    const {
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
