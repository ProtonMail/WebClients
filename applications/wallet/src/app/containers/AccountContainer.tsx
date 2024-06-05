import { useMemo } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, useModalState } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../atoms';
import { AccountPreferencesModal } from '../components/AccountPreferencesModal';
import { Balance } from '../components/Balance';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { TransactionList } from '../components/TransactionList';
import { useBitcoinBlockchainContext } from '../contexts';
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { getThemeForWallet } from '../utils';

export const AccountContainer = () => {
    const { walletId, accountId } = useParams<{ walletId?: string; accountId?: string }>();
    const history = useHistory();

    const [walletSendModal, setWalletSendModal] = useModalState();
    const [accountPreferencesModalState, setAccountPreferencesModalState] = useModalState();

    const { decryptedApiWalletsData, setPassphrase, syncSingleWallet, isSyncing } = useBitcoinBlockchainContext();
    const { openDrawer } = useWalletDrawerContext();

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

    const theme = getThemeForWallet(decryptedApiWalletsData, wallet.Wallet.ID);

    const walletAccount = wallet.WalletAccounts.find(({ ID }) => ID === accountId);

    if (!walletAccount) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}`} />;
    }

    const isSyncingChainData = isSyncing(wallet.Wallet.ID, walletAccount.ID);

    return (
        <>
            <div className={clsx('flex flex-row w-full min-h-full flex-nowrap', theme)}>
                <div className="flex flex-column flex-1 p-8 pt-0 flex-nowrap grow">
                    <div className="flex flex-row m-4 items-center">
                        <h1 className="mr-4 text-semibold">{walletAccount.Label}</h1>

                        <CoreButton
                            icon
                            size="medium"
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak"
                            onClick={() => {
                                setAccountPreferencesModalState(true);
                            }}
                        >
                            <Icon
                                alt={c('Account container').t`Edit`}
                                name="pen-square"
                                className="color-hint"
                                size={5}
                            />
                        </CoreButton>
                    </div>

                    {/* Balance */}
                    <Balance apiWalletData={wallet} apiAccount={walletAccount} />

                    {/* Wallet metrics and cta (send, buy, receive) */}
                    <MetricsAndCtas
                        apiWalletData={wallet}
                        apiAccount={walletAccount}
                        disabled={isSyncingChainData}
                        onClickSend={() => setWalletSendModal(true)}
                        onClickReceive={() => {
                            openDrawer({ account: walletAccount, kind: 'wallet-receive', theme });
                        }}
                    />

                    <TransactionList apiWalletData={wallet} apiAccount={walletAccount} />

                    <PassphraseInputModal
                        wallet={wallet}
                        isOpen={needPassphrase}
                        onClose={history.goBack}
                        onConfirmPassphrase={(passphrase) => {
                            setPassphrase(wallet.Wallet.ID, passphrase);
                            void syncSingleWallet({ walletId: wallet.Wallet.ID });
                        }}
                    />

                    {!isSyncingChainData && (
                        <BitcoinSendModal wallet={wallet} account={walletAccount} {...walletSendModal} />
                    )}
                </div>
            </div>

            <AccountPreferencesModal
                wallet={wallet}
                otherWallets={otherWallets}
                walletAccount={walletAccount}
                {...accountPreferencesModalState}
            />
        </>
    );
};
