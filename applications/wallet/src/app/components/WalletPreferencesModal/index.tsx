import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    ModalOwnProps,
} from '@proton/components/components';
import warningSignSrc from '@proton/styles/assets/img/illustrations/warning-sign.svg';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { WalletSetupScheme } from '../../hooks/useWalletSetup/type';
import { AccountPreferences } from '../AccountPreferences';
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
        loadingDeletion,
        handleWalletDeletion,
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
                                    disabled={loadingDeletion}
                                    shape="solid"
                                    color="norm"
                                    className="mt-6"
                                    onClick={() => {
                                        if (wallet.Wallet.Mnemonic) {
                                            openBackupModal({
                                                schemeAndData: {
                                                    scheme: WalletSetupScheme.WalletBackup,
                                                    mnemonic: WasmMnemonic.fromString(wallet.Wallet.Mnemonic),
                                                },
                                            });
                                        }
                                    }}
                                >{c('Wallet preference').t`Back up wallet`}</Button>

                                <Button
                                    fullWidth
                                    disabled={loadingDeletion}
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

            <Modal {...walletDeletionConfirmationModal}>
                <div className="flex flex-column mb-4">
                    <div className="flex mx-auto mb-6">
                        <img src={warningSignSrc} alt={c('Wallet deletion').t`Warning:'`} />
                    </div>
                    <h3 className="text-4xl text-bold mx-auto text-center">{c('Wallet deletion')
                        .t`Confirm to delete '${wallet.Wallet.Name}'`}</h3>

                    <p className="color-weak text-center mx-12">
                        <span className="block my-2">{c('Wallet setup')
                            .t`Please backup your secret recovery phrase before you delete your wallet.`}</span>
                        <span className="block my-2">{c('Wallet setup')
                            .t`This mnemonic can help you restoring your wallet next time or on another compatible software.`}</span>
                    </p>
                </div>

                <div className="flex flex-column">
                    <Button
                        fullWidth
                        disabled={loadingDeletion}
                        shape="solid"
                        color="norm"
                        onClick={() => {
                            if (wallet.Wallet.Mnemonic) {
                                openBackupModal({
                                    schemeAndData: {
                                        scheme: WalletSetupScheme.WalletBackup,
                                        mnemonic: WasmMnemonic.fromString(wallet.Wallet.Mnemonic),
                                    },
                                });
                            }
                        }}
                    >{c('Wallet preference').t`Back up wallet first`}</Button>

                    <Button
                        fullWidth
                        disabled={loadingDeletion}
                        shape="solid"
                        color="weak"
                        onClick={() => handleWalletDeletion()}
                        className="mt-2 color-weak"
                    >{c('Wallet preference').t`Delete this wallet`}</Button>
                </div>
            </Modal>
        </>
    );
};
