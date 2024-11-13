import { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Icon, useModalState, useNotifications } from '@proton/components';
import { MINUTE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { Button, CoreButton } from '../atoms';
import { LayoutViewLoader } from '../atoms/LayoutViewLoader';
import { Balance } from '../components/Balance';
import { BitcoinBuyModal } from '../components/BitcoinBuyModal';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { InvitesButton } from '../components/InvitesButton';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { WalletMainContent } from '../components/WalletMainContent';
import { WalletPreferencesModal } from '../components/WalletPreferencesModal';
import { useBitcoinBlockchainContext } from '../contexts';
import { useResponsiveContainerContext } from '../contexts/ResponsiveContainerContext';
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { useWalletPassphrase } from '../hooks/useWalletPassphrase';
import { getThemeForWallet } from '../utils';

export const WalletContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const { openDrawer } = useWalletDrawerContext();

    const { isNarrow } = useResponsiveContainerContext();

    // Used to reset bitcoin send modal at the end of the process
    const generateBitcoinSendKey = () => generateUID('bitcoin-send');
    const [bitcoinSendKey, setBitcoinSendKey] = useState(generateBitcoinSendKey());

    const [walletPreferencesModalState, setWalletPreferencesModalState, renderWalletPreferencesModalState] =
        useModalState();
    const [walletSendModal, setWalletSendModal, renderWalletSendModal] = useModalState();
    const [walletBuyModal, setWalletBuyModal, renderWalletBuyModal] = useModalState();

    const { apiWalletsData, getSyncingData } = useBitcoinBlockchainContext();

    const { createNotification, removeNotification } = useNotifications();
    const notificationRef = useRef<number>();

    const walletIndex = useMemo(
        () => apiWalletsData?.findIndex(({ Wallet }) => Wallet.ID === walletId),
        [walletId, apiWalletsData]
    );

    const wallet = Number.isFinite(walletIndex) ? apiWalletsData?.[walletIndex as number] : undefined;

    const otherWallets = [
        ...(apiWalletsData?.slice(0, walletIndex) ?? []),
        ...(apiWalletsData?.slice((walletIndex ?? 0) + 1) ?? []),
    ];

    const syncingData = wallet?.Wallet?.ID ? getSyncingData(wallet?.Wallet?.ID) : undefined;
    const isSyncing = Boolean(syncingData?.syncing);
    const didFailedSyncing = Boolean(syncingData?.error);

    useEffect(() => {
        if (isSyncing) {
            notificationRef.current = createNotification({
                text: c('Wallet').t`Syncing new data`,
                expiration: 10 * MINUTE,
                showCloseButton: false,
            });
        } else if (notificationRef.current) {
            removeNotification(notificationRef.current);
        }
    }, [createNotification, isSyncing, removeNotification]);

    const { canUseWallet } = useWalletPassphrase(wallet);

    if (!apiWalletsData) {
        return <LayoutViewLoader />;
    }

    if (!wallet) {
        return <Redirect to={'/'} />;
    }

    if (wallet.IsNotDecryptable) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}/locked`} />;
    }

    const theme = getThemeForWallet(apiWalletsData, wallet.Wallet.ID);

    const [firstWalletAccount] = wallet.WalletAccounts;

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
                                className="ml-2 mr-6 bg-weak shrink-0"
                                onClick={() => {
                                    setWalletPreferencesModalState(true);
                                }}
                            >
                                <Icon alt={c('Action').t`Edit`} name="cog-drawer" size={5} />
                            </CoreButton>
                        </div>
                        <div className="ui-standard">
                            <Button
                                size="small"
                                shape="ghost"
                                color="norm"
                                className="my-2 button-lighter"
                                onClick={() => {
                                    openDrawer({ kind: 'discover', wallet, theme });
                                }}
                            >
                                {c('Wallet header').t`Secure your wallet`}
                                <Icon alt={c('Action').t`Secure your wallet`} name="chevron-right" className="ml-2" />
                            </Button>
                            <InvitesButton walletAccount={firstWalletAccount} />
                        </div>
                    </div>

                    {/* Balance */}
                    <Balance apiWalletData={wallet} disabled={!canUseWallet} />

                    {/* Wallet metrics and cta (send, buy, receive) */}
                    <MetricsAndCtas
                        apiWalletData={wallet}
                        disabled={isSyncing || didFailedSyncing || !canUseWallet}
                        onClickSend={() => setWalletSendModal(true)}
                        onClickReceive={() => {
                            openDrawer({ kind: 'wallet-receive', wallet, theme });
                        }}
                        onClickBuy={() => {
                            setWalletBuyModal(true);
                        }}
                    />

                    {canUseWallet && (
                        <WalletMainContent
                            apiWalletData={wallet}
                            onClickReceive={() => {
                                openDrawer({ kind: 'wallet-receive', wallet, theme });
                            }}
                            onClickBuy={() => {
                                setWalletBuyModal(true);
                            }}
                        />
                    )}

                    {renderWalletPreferencesModalState && (
                        <WalletPreferencesModal
                            wallet={wallet}
                            otherWallets={otherWallets}
                            theme={theme}
                            {...walletPreferencesModalState}
                        />
                    )}
                </div>
            </div>

            {renderWalletSendModal && (
                <BitcoinSendModal
                    key={bitcoinSendKey}
                    wallet={wallet}
                    theme={theme}
                    modal={walletSendModal}
                    onDone={() => {
                        setBitcoinSendKey(generateBitcoinSendKey());
                    }}
                />
            )}

            {renderWalletBuyModal && <BitcoinBuyModal wallet={wallet} modal={walletBuyModal} />}
        </>
    );
};
