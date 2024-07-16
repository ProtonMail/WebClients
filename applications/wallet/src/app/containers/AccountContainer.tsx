import { useEffect, useMemo, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import generateUID from '@proton/atoms/generateUID';
import { Icon, useModalState } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../atoms';
import { Balance } from '../components/Balance';
import { BitcoinBuyModal } from '../components/BitcoinBuyModal';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { TransactionList } from '../components/TransactionList';
import { WalletPreferencesModal } from '../components/WalletPreferencesModal';
import { useBitcoinBlockchainContext } from '../contexts';
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { getThemeForWallet } from '../utils';

// Used to reset bitcoin buy modal at the end of the process
const generateBitcoinBuyKey = () => generateUID(`bitcoin-buy`);

// Used to reset bitcoin send modal at the end of the process
const generateBitcoinSendKey = () => generateUID(`bitcoin-send`);

export const AccountContainer = () => {
    const { walletId, accountId } = useParams<{ walletId?: string; accountId?: string }>();
    const history = useHistory();

    const [bitcoinSendKey, setBitcoinSendKey] = useState(generateBitcoinSendKey());

    const [bitcoinBuyKey, setBitcoinBuyKey] = useState(generateBitcoinBuyKey());

    useEffect(() => {
        setBitcoinSendKey(generateBitcoinSendKey());
        setBitcoinBuyKey(generateBitcoinBuyKey());
    }, [walletId, accountId]);

    const [walletSendModal, setWalletSendModal] = useModalState();
    const [walletBuyModal, setWalletBuyModal] = useModalState();
    const [walletPreferencesModalState, setWalletPreferencesModalState, renderWalletPreferencesModalState] =
        useModalState();

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
            <div
                className={clsx('wallet-main relative flex flex-row flex-nowrap w-full min-h-full flex-nowrap', theme)}
            >
                <div className={clsx('flex flex-column flex-1 flex-nowrap grow p-8 pt-8')}>
                    <div className="flex flex-row flex-nowrap m-4 items-center">
                        <h1 className="mr-4 text-semibold text-ellipsis">{walletAccount.Label}</h1>

                        <CoreButton
                            icon
                            size="medium"
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak shrink-0"
                            onClick={() => {
                                setWalletPreferencesModalState(true);
                            }}
                        >
                            <Icon alt={c('Action').t`Edit`} name="cog-drawer" size={5} />
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
                            openDrawer({ kind: 'wallet-receive', account: walletAccount, wallet, theme });
                        }}
                        onClickBuy={() => {
                            setWalletBuyModal(true);
                        }}
                    />

                    <TransactionList
                        apiWalletData={wallet}
                        apiAccount={walletAccount}
                        onClickReceive={() => {
                            openDrawer({ kind: 'wallet-receive', account: walletAccount, wallet, theme });
                        }}
                        onClickBuy={() => {
                            setWalletBuyModal(true);
                        }}
                    />

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
                        <>
                            <BitcoinSendModal
                                key={bitcoinSendKey}
                                wallet={wallet}
                                account={walletAccount}
                                theme={theme}
                                modal={walletSendModal}
                                onDone={() => {
                                    setBitcoinSendKey(generateBitcoinSendKey());
                                }}
                            />

                            <BitcoinBuyModal
                                key={bitcoinBuyKey}
                                wallet={wallet}
                                modal={walletBuyModal}
                                account={walletAccount}
                                onDone={() => {
                                    setBitcoinBuyKey(generateBitcoinBuyKey());
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {renderWalletPreferencesModalState && (
                <WalletPreferencesModal wallet={wallet} otherWallets={otherWallets} {...walletPreferencesModalState} />
            )}
        </>
    );
};
