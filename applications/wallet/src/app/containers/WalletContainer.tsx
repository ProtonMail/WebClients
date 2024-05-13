import { useMemo } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, useModalState } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../atoms';
import { BitcoinReceiveModal } from '../components';
import { Balance } from '../components/Balance';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { TransactionList } from '../components/TransactionList';
import { WalletPreferencesModal } from '../components/WalletPreferencesModal';
import { useBitcoinBlockchainContext } from '../contexts';
import { getThemeByIndex } from '../utils';

export const WalletContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const history = useHistory();

    const [walletPreferencesModalState, setWalletPreferencesModalState] = useModalState();
    const [walletSendModal, setWalletSendModal] = useModalState();
    const [walletReceiveModal, setWalletReceiveModal] = useModalState();

    const { decryptedApiWalletsData, setPassphrase, syncSingleWallet } = useBitcoinBlockchainContext();

    const walletIndex = useMemo(
        () => decryptedApiWalletsData?.findIndex(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    const wallet = Number.isFinite(walletIndex) && decryptedApiWalletsData?.[walletIndex as number];
    const otherWallets = [
        ...(decryptedApiWalletsData?.slice(0, walletIndex) ?? []),
        ...(decryptedApiWalletsData?.slice((walletIndex ?? 0) + 1) ?? []),
    ];

    if (!decryptedApiWalletsData) {
        return <CircleLoader />;
    }

    // TODO: add a reactivation modal similar to calendar's one
    if (!wallet || wallet.IsNotDecryptable) {
        return <Redirect to={'/'} />;
    }

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const theme = getThemeByIndex(walletIndex as number);

    // TODO: add account selector instead of that
    const firstAccount = wallet.WalletAccounts[0];

    return (
        <>
            <div className={clsx('flex flex-row w-full min-h-full flex-nowrap', theme)}>
                <div className="flex flex-column flex-1 p-8 pt-0 flex-nowrap grow">
                    <div className="flex flex-row m-4 items-center">
                        <h1 className="mr-4 text-semibold">{wallet.Wallet.Name}</h1>

                        <CoreButton
                            icon
                            size="medium"
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak"
                            onClick={() => {
                                setWalletPreferencesModalState(true);
                            }}
                        >
                            <Icon name="pen-square" className="color-hint" size={5} />
                        </CoreButton>
                    </div>

                    {/* Balance */}
                    <Balance apiWalletData={wallet} />

                    {/* Wallet metrics and cta (send, buy, receive) */}
                    <MetricsAndCtas
                        onClickSend={() => setWalletSendModal(true)}
                        onClickReceive={() => setWalletReceiveModal(true)}
                    />

                    <TransactionList apiWalletData={wallet} />

                    <PassphraseInputModal
                        wallet={wallet}
                        isOpen={needPassphrase}
                        onClose={history.goBack}
                        onConfirmPassphrase={(passphrase) => {
                            setPassphrase(wallet.Wallet.ID, passphrase);
                            void syncSingleWallet(wallet.Wallet.ID);
                        }}
                    />

                    <WalletPreferencesModal
                        wallet={wallet}
                        otherWallets={otherWallets}
                        {...walletPreferencesModalState}
                    />

                    {firstAccount && (
                        <>
                            <BitcoinReceiveModal account={firstAccount} {...walletReceiveModal} />
                            <BitcoinSendModal wallet={wallet} account={firstAccount} {...walletSendModal} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
