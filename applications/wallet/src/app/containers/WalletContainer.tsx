import { useMemo } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

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
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { getThemeForWallet } from '../utils';

export const WalletContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const history = useHistory();
    const { openDrawer } = useWalletDrawerContext();

    const [walletPreferencesModalState, setWalletPreferencesModalState, renderWalletPreferencesModalState] =
        useModalState();
    const [walletSendModal, setWalletSendModal] = useModalState();
    const [walletReceiveModal, setWalletReceiveModal] = useModalState();

    const { decryptedApiWalletsData, setPassphrase, syncSingleWallet, isSyncing } = useBitcoinBlockchainContext();

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

    if (!wallet) {
        return <Redirect to={'/'} />;
    }

    if (wallet.IsNotDecryptable) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}/locked`} />;
    }

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const theme = getThemeForWallet(decryptedApiWalletsData, wallet.Wallet.ID);

    // TODO: add account selector instead of that
    const firstAccount = wallet.WalletAccounts[0];

    const isSyncingChainData = isSyncing(wallet.Wallet.ID);

    return (
        <>
            <div className={clsx('flex flex-row w-full min-h-full flex-nowrap', theme)}>
                <div className="flex flex-column flex-1 p-8 pt-0 flex-nowrap grow">
                    <div className="flex flex-row justify-space-between m-4 items-center">
                        <div className="flex flex-row items-center">
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
                                <Icon
                                    alt={c('Wallet container').t`Edit`}
                                    name="pen-square"
                                    className="color-hint"
                                    size={5}
                                />
                            </CoreButton>
                        </div>

                        <CoreButton
                            shape="underline"
                            color="norm"
                            onClick={() => {
                                openDrawer({ discover: true, wallet });
                            }}
                        >{c('Wallet header').t`Secure your wallet`}</CoreButton>
                    </div>

                    {/* Balance */}
                    <Balance apiWalletData={wallet} />

                    {/* Wallet metrics and cta (send, buy, receive) */}
                    <MetricsAndCtas
                        apiWalletData={wallet}
                        disabled={isSyncingChainData}
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

                    {renderWalletPreferencesModalState && (
                        <WalletPreferencesModal
                            wallet={wallet}
                            otherWallets={otherWallets}
                            {...walletPreferencesModalState}
                        />
                    )}

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
