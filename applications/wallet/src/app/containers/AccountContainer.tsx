import { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { MINUTE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { CoreButton } from '../atoms';
import { Balance } from '../components/Balance';
import { BitcoinBuyModal } from '../components/BitcoinBuyModal';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { InvitesButton } from '../components/InvitesButton';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { TransactionList } from '../components/TransactionList';
import { WalletPreferencesModal } from '../components/WalletPreferencesModal';
import { useBitcoinBlockchainContext } from '../contexts';
import { useResponsiveContainerContext } from '../contexts/ResponsiveContainerContext';
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { getThemeForWallet } from '../utils';

// Used to reset bitcoin buy modal at the end of the process
const generateBitcoinBuyKey = () => generateUID(`bitcoin-buy`);

// Used to reset bitcoin send modal at the end of the process
const generateBitcoinSendKey = () => generateUID(`bitcoin-send`);

export const AccountContainer = () => {
    const { walletId, accountId } = useParams<{ walletId?: string; accountId?: string }>();
    const history = useHistory();

    const { isNarrow } = useResponsiveContainerContext();

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

    const { apiWalletsData, syncSingleWallet, isSyncing } = useBitcoinBlockchainContext();

    const { createNotification, removeNotification } = useNotifications();
    const notificationRef = useRef<number>();

    const { openDrawer } = useWalletDrawerContext();

    const walletIndex = useMemo(
        () => apiWalletsData?.findIndex(({ Wallet }) => Wallet.ID === walletId),
        [walletId, apiWalletsData]
    );

    const wallet = Number.isFinite(walletIndex) ? apiWalletsData?.[walletIndex as number] : undefined;
    const otherWallets = [
        ...(apiWalletsData?.slice(0, walletIndex) ?? []),
        ...(apiWalletsData?.slice((walletIndex ?? 0) + 1) ?? []),
    ];

    const walletAccount = wallet?.WalletAccounts?.find(({ ID }) => ID === accountId);
    const isSyncingChainData = Boolean(
        wallet?.Wallet?.ID && walletAccount?.ID && isSyncing(wallet.Wallet.ID, walletAccount.ID)
    );

    useEffect(() => {
        if (isSyncingChainData) {
            notificationRef.current = createNotification({
                text: c('Wallet').t`Syncing new data`,
                expiration: 10 * MINUTE,
                showCloseButton: false,
            });
        } else if (notificationRef.current) {
            removeNotification(notificationRef.current);
        }
    }, [createNotification, isSyncingChainData, removeNotification]);

    if (!apiWalletsData) {
        return <CircleLoader />;
    }

    // TODO: add a reactivation modal similar to calendar's one
    if (!wallet || wallet.IsNotDecryptable) {
        return <Redirect to={'/'} />;
    }

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const theme = getThemeForWallet(apiWalletsData, wallet.Wallet.ID);

    if (!walletAccount) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}`} />;
    }

    return (
        <>
            <div
                className={clsx('wallet-main relative flex flex-row flex-nowrap w-full min-h-full flex-nowrap', theme)}
            >
                <div className={clsx('flex flex-column flex-1 flex-nowrap grow', isNarrow ? 'p-1 pt-4' : 'p-8 pt-8')}>
                    <div className="flex flex-row justify-space-between m-4 items-center">
                        <div className="flex flex-row flex-nowrap items-center">
                            <h1 className="mr-4 text-semibold text-ellipsis">{wallet.Wallet.Name}</h1>

                            <CoreButton
                                icon
                                pill
                                size="medium"
                                shape="ghost"
                                color="weak"
                                className="ml-2 bg-weak shrink-0"
                                onClick={() => {
                                    setWalletPreferencesModalState(true);
                                }}
                            >
                                <Icon alt={c('Action').t`Edit`} name="cog-drawer" size={5} />
                            </CoreButton>
                        </div>

                        <div className="ui-standard">
                            <InvitesButton walletAccount={walletAccount} />
                        </div>
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
                        onConfirmPassphrase={() => {
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
                <WalletPreferencesModal
                    wallet={wallet}
                    otherWallets={otherWallets}
                    theme={theme}
                    {...walletPreferencesModalState}
                />
            )}
        </>
    );
};
