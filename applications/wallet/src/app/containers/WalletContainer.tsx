import { useMemo, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import { Icon, useModalState } from '@proton/components/components';
import { useLoading } from '@proton/hooks/index';
import clsx from '@proton/utils/clsx';
import { encryptWalletDataWithWalletKey, getPassphraseLocalStorageKey } from '@proton/wallet';

import { Button, CoreButton } from '../atoms';
import { LayoutViewLoader } from '../atoms/LayoutViewLoader';
import { Balance } from '../components/Balance';
import { BitcoinBuyModal } from '../components/BitcoinBuyModal';
import { BitcoinSendModal } from '../components/BitcoinSendModal';
import { MetricsAndCtas } from '../components/MetricsAndCtas';
import { PassphraseInputModal } from '../components/PassphraseInputModal';
import { TransactionList } from '../components/TransactionList';
import { WalletPreferencesModal } from '../components/WalletPreferencesModal';
import { useBitcoinBlockchainContext } from '../contexts';
import { useResponsiveContainerContext } from '../contexts/ResponsiveContainerContext';
import { useWalletDrawerContext } from '../contexts/WalletDrawerContext';
import { getThemeForWallet } from '../utils';

export const WalletContainer = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const history = useHistory();
    const { openDrawer } = useWalletDrawerContext();
    const [loading, withLoading] = useLoading();

    const { isNarrow } = useResponsiveContainerContext();

    // Used to reset bitcoin send modal at the end of the process
    const generateBitcoinSendKey = () => generateUID('bitcoin-send');
    const [bitcoinSendKey, setBitcoinSendKey] = useState(generateBitcoinSendKey());

    // Used to reset bitcoin buy modal at the end of the process
    const generateBitcoinBuyKey = () => generateUID('bitcoin-buy');
    const [bitcoinBuyKey, setBitcoinBuyKey] = useState(generateBitcoinSendKey());

    const [walletPreferencesModalState, setWalletPreferencesModalState, renderWalletPreferencesModalState] =
        useModalState();
    const [walletSendModal, setWalletSendModal] = useModalState();
    const [walletBuyModal, setWalletBuyModal] = useModalState();

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
        return <LayoutViewLoader />;
    }

    if (!wallet) {
        return <Redirect to={'/'} />;
    }

    if (wallet.IsNotDecryptable) {
        return <Redirect to={`/wallets/${wallet.Wallet.ID}/locked`} />;
    }

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const theme = getThemeForWallet(decryptedApiWalletsData, wallet.Wallet.ID);

    const isSyncingChainData = isSyncing(wallet.Wallet.ID);

    const loadWalletWithPassphrase = async (passphrase: string) => {
        setPassphrase(wallet.Wallet.ID, passphrase);
        if (wallet.WalletKey?.DecryptedKey && wallet.Wallet.Fingerprint) {
            const [encryptedPassphrase] = await encryptWalletDataWithWalletKey(
                [passphrase],
                wallet.WalletKey.DecryptedKey
            );
            localStorage.setItem(getPassphraseLocalStorageKey(wallet.Wallet.Fingerprint), encryptedPassphrase);
        }

        void syncSingleWallet({ walletId: wallet.Wallet.ID });
    };

    return (
        <>
            <div className={clsx('flex flex-row flex-nowrap w-full min-h-full flex-nowrap', theme)}>
                <div className={clsx('flex flex-column flex-1 pt-0 flex-nowrap grow', isNarrow ? 'p-1' : 'p-8')}>
                    <div className="flex flex-row justify-space-between m-4 items-center">
                        <div className="flex flex-row flex-nowrap items-center">
                            <h1 className="mr-4 text-semibold text-ellipsis">{wallet.Wallet.Name}</h1>

                            <CoreButton
                                icon
                                size="medium"
                                shape="ghost"
                                color="weak"
                                className="ml-2 mr-6 rounded-full bg-weak no-shrink"
                                disabled={loading}
                                onClick={() => {
                                    setWalletPreferencesModalState(true);
                                }}
                            >
                                <Icon alt={c('Wallet container').t`Edit`} name="cog-drawer" size={5} />
                            </CoreButton>
                        </div>

                        <Button
                            size="small"
                            shape="ghost"
                            color="norm"
                            className="my-2"
                            onClick={() => {
                                openDrawer({ kind: 'discover', wallet, theme });
                            }}
                        >
                            {c('Wallet header').t`Secure your wallet`}
                            <Icon
                                alt={c('Wallet header').t`Secure your wallet`}
                                name="chevron-right"
                                className="ml-2"
                            />
                        </Button>
                    </div>

                    {/* Balance */}
                    <Balance apiWalletData={wallet} />

                    {/* Wallet metrics and cta (send, buy, receive) */}
                    <MetricsAndCtas
                        apiWalletData={wallet}
                        disabled={isSyncingChainData}
                        onClickSend={() => setWalletSendModal(true)}
                        onClickReceive={() => {
                            openDrawer({ kind: 'wallet-receive', wallet, theme });
                        }}
                        onClickBuy={() => {
                            setWalletBuyModal(true);
                        }}
                    />

                    <TransactionList
                        apiWalletData={wallet}
                        onClickReceive={() => {
                            openDrawer({ kind: 'wallet-receive', wallet, theme });
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
                            void withLoading(loadWalletWithPassphrase(passphrase));
                        }}
                    />

                    {renderWalletPreferencesModalState && (
                        <WalletPreferencesModal
                            wallet={wallet}
                            otherWallets={otherWallets}
                            {...walletPreferencesModalState}
                        />
                    )}
                </div>
            </div>

            <BitcoinSendModal
                key={bitcoinSendKey}
                wallet={wallet}
                theme={theme}
                modal={walletSendModal}
                onDone={() => {
                    setBitcoinSendKey(generateBitcoinSendKey());
                }}
            />

            <BitcoinBuyModal
                wallet={wallet}
                key={bitcoinBuyKey}
                modal={walletBuyModal}
                onDone={() => {
                    setBitcoinBuyKey(generateBitcoinBuyKey());
                }}
            />
        </>
    );
};
