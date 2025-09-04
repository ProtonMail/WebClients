import { useState } from 'react';

import type { QRCode as QRCodeType } from 'jsqr';
import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import { WasmAccountSweeper, type WasmApiWalletAccount, type WasmBitcoinUnit, type WasmPsbt } from '@proton/andromeda';
import { CircleLoader, Tooltip } from '@proton/atoms';
import {
    Icon,
    MiddleEllipsis,
    type ModalStateProps,
    Prompt,
    useModalState,
    useModalStateWithData,
} from '@proton/components';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import walletBitcoinDark from '@proton/styles/assets/img/wallet/wallet-bitcoin-dark.jpg';
import walletBitcoin from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';
import { COMPUTE_BITCOIN_UNIT, MIN_FEE_RATE, PriorityTargetBlock } from '@proton/wallet';
import { useExchangeRate, useUserWalletSettings } from '@proton/wallet/store';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button, CoreButton, Input } from '../../atoms';
import { MaybeHiddenAmount } from '../../atoms/MaybeHiddenAmount';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { Price } from '../../atoms/Price';
import { PASSWORD_MANAGER_IGNORE_PROPS } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useFeesInput } from '../../hooks/useFeesInput';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import {
    convertAmountStr,
    getExchangeRateFromBitcoinUnit,
    getLabelByUnit,
    isUndefined,
    signAndBroadcastPsbt,
} from '../../utils';
import { SecondaryAmount } from '../BitcoinSendModal/SecondaryAmount';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';
import { QRCodeReaderModal } from '../QRCodeReaderModal';
import type { RecipientDetailsModalOwnProps } from '../RecipientDetailsModal';
import { RecipientDetailsModal } from '../RecipientDetailsModal';

import './ImportPaperWalletModal.scss';

interface Props extends ModalStateProps {
    account: WasmApiWalletAccount;
    onCloseDrawer?: () => void;
}

export const ImportPaperWalletModal = ({ account, onClose, onCloseDrawer, ...modalProps }: Props) => {
    const theme = useWalletTheme();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const [qrCodeModal, setQrCodeModal, renderQrCodeModal] = useModalState();
    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<RecipientDetailsModalOwnProps>();

    const [settings] = useUserWalletSettings();
    const [userKeys] = useUserKeys();

    const txBuilderHelpers = useTxBuilder();
    const { getFeesByBlockTarget } = useFeesInput(txBuilderHelpers);

    const { createNotification } = useNotifications();

    const blockchainClient = useBlockchainClient();

    const [exchangeRate] = useExchangeRate(account.FiatCurrency);
    const exchangeRateOrBitcoinUnit = exchangeRate ?? getExchangeRateFromBitcoinUnit(settings.BitcoinUnit);

    const { network, walletsChainData, walletMap, syncSingleWalletAccount, bitcoinAddressHelperByWalletAccountId } =
        useBitcoinBlockchainContext();

    const bitcoinAddressHelper = account.ID ? bitcoinAddressHelperByWalletAccountId[account.ID] : undefined;

    const bitcoinAddressIndex = bitcoinAddressHelper?.receiveBitcoinAddress.index;

    const [privateKey, setPrivateKey] = useState<string>('');

    const [loadingCreatePsbt, withLoadingCreatePsbt] = useLoading();
    const [psbt, setPsbt] = useState<WasmPsbt | undefined>(undefined);
    const [outputsAmount, setOutputsAmount] = useState<Number | undefined>(undefined);
    const [publicAddress, setPublicAddress] = useState<string | undefined>(undefined);
    const [cameraPermissionError, setCameraPermissionError] = useState<DOMException['name']>();
    const [recipient, setRecipient] = useState<string | undefined>(undefined);

    const [error, setError] = useState<String | undefined>(undefined);

    const handlePrivateKey = (updatedValue: string) => {
        setPrivateKey(updatedValue);
        setError(undefined);
        setPsbt(undefined);
        setPublicAddress(undefined);
    };
    const handleScan = (qrcode: QRCodeType) => {
        const value = qrcode.data.trimStart();
        handlePrivateKey(value);
        qrCodeModal.onClose();
    };

    const onScanPaperWallet = async () => {
        const accountWithChainData = account && walletsChainData[account.WalletID]?.accounts[account.ID];
        const wasmAccount = accountWithChainData?.account;

        if (wasmAccount && !isUndefined(network) && !isUndefined(bitcoinAddressIndex)) {
            try {
                const feeRate = getFeesByBlockTarget(PriorityTargetBlock.MedianPriorityTargetBlock) ?? MIN_FEE_RATE;
                const draftPsbt = await new WasmAccountSweeper(blockchainClient, wasmAccount).getSweepWifPsbt(
                    privateKey,
                    BigInt(feeRate),
                    bitcoinAddressIndex,
                    network
                );
                setPsbt(draftPsbt);
                setPublicAddress(draftPsbt.public_address);
                setOutputsAmount(Number(draftPsbt.outputs_amount));
                setConfirmModal(true);
                const walletData = account && walletMap[account.WalletID];
                setRecipient(`${walletData?.wallet.Wallet.Name} - ${account.Label}`);
            } catch (error: any) {
                if (error?.kind === 'InsufficientFundsInPaperWallet') {
                    setError(c('Sweep paper wallet').t`No funds available`);
                    createNotification({
                        type: 'error',
                        text: c('Sweep paper wallet').t`Your paper wallet has no funds available`,
                    });
                } else {
                    setError(c('Sweep paper wallet').t`Invalid private key`);
                    createNotification({
                        type: 'error',
                        text: c('Sweep paper wallet')
                            .t`Your paper wallet is not valid. Please check your private key and try again`,
                    });
                }
            }
        }
    };

    const onPaperWalletSubmit = async () => {
        const accountWithChainData = account && walletsChainData[account.WalletID]?.accounts[account.ID];
        const wasmAccount = accountWithChainData?.account;
        if (wasmAccount && !isUndefined(network) && !isUndefined(bitcoinAddressIndex)) {
            try {
                // Typeguard
                if (!psbt || !account || !userKeys) {
                    return;
                }

                const walletId = account.WalletID;
                const walletAccountId = account.ID;

                const apiWalletData = walletMap[walletId]?.wallet;
                const apiAccount = walletMap[walletId]?.accounts[walletAccountId];

                if (!apiWalletData || !apiAccount) {
                    return;
                }

                await signAndBroadcastPsbt({
                    psbt,
                    blockchainClient,
                    network,
                    userKeys,

                    walletsChainData,
                    apiWalletData,
                    apiAccount,

                    exchangeRateId: !exchangeRate || 'isBitcoinRate' in exchangeRate ? undefined : exchangeRate?.ID,

                    onBroadcastedTx: () => {
                        void syncSingleWalletAccount({
                            walletId: walletId,
                            accountId: walletAccountId,
                            manual: true,
                        });

                        confirmModal.onClose?.();
                        onClose?.();
                        onCloseDrawer?.();
                    },

                    isPaperWallet: true,
                });

                createNotification({
                    text: c('Sweep paper wallet').t`Paper wallet funds was successfully imported`,
                });
            } catch (error: any) {
                if (error?.kind === 'InsufficientFundsInPaperWallet') {
                    setError(c('Sweep paper wallet').t`Your paper wallet has no funds available`);
                    createNotification({
                        type: 'error',
                        text: c('Sweep paper wallet').t`Your paper wallet has no funds available`,
                    });
                } else {
                    setError(
                        c('Sweep paper wallet')
                            .t`Your paper wallet is not valid. Please check your private key and try again`
                    );
                    createNotification({
                        type: 'error',
                        text: c('Sweep paper wallet')
                            .t`Your paper wallet is not valid. Please check your private key and try again`,
                    });
                }
            }
        }
    };

    return (
        <>
            <Prompt
                buttons={[
                    <Button
                        fullWidth
                        size="large"
                        shape="solid"
                        color="norm"
                        disabled={loadingCreatePsbt || privateKey === '' || !!error}
                        onClick={() => {
                            void withLoadingCreatePsbt(onScanPaperWallet());
                        }}
                    >
                        {c('Sweep paper wallet').t`Continue`}
                    </Button>,
                    <Button
                        fullWidth
                        className="mx-auto"
                        size="large"
                        shape="solid"
                        color="weak"
                        onClick={() => {
                            onClose();
                        }}
                    >{c('Sweep paper wallet').t`Cancel`}</Button>,
                ]}
                {...modalProps}
            >
                {loadingCreatePsbt && (
                    <div
                        className="fixed top-0 left-0 w-full h-full flex flex-column items-center justify-center"
                        style={{ background: 'var(--bg-overlay)', zIndex: 100 }}
                    >
                        <CircleLoader size="medium" className="color-primary" />
                    </div>
                )}
                <div className="flex flex-column items-center">
                    <img
                        className="h-custom w-custom"
                        src={theme === WalletThemeOption.WalletDark ? walletBitcoinDark : walletBitcoin}
                        alt=""
                        style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                    />
                </div>
                <h1 className="text-semibold text-break text-3xl mt-3 mb-4 text-center">
                    {c('Sweep paper wallet').t`Import paper wallet`}
                </h1>
                <ModalParagraph>
                    <p className="m-auto">{c('Wallet setup')
                        .t`Transfer your paper wallet funds to your account. Paste your private key or scan your QR code.`}</p>
                </ModalParagraph>
                <div className="flex flex-column gap-1">
                    <Input
                        label={c('Wallet setup').t`Your private key`}
                        id="paper-wallet-private-key"
                        {...PASSWORD_MANAGER_IGNORE_PROPS}
                        autoFocus
                        value={privateKey}
                        onValue={handlePrivateKey}
                        disabled={loadingCreatePsbt}
                        error={error}
                        suffix={
                            <Tooltip
                                title={(() => {
                                    if (cameraPermissionError === 'NotAllowedError') {
                                        return c('Sweep paper wallet')
                                            .t`Please grant camera permission to use QR Code scanner`;
                                    }

                                    if (!!cameraPermissionError) {
                                        return c('Sweep paper wallet')
                                            .t`Cannot use QR Code scanner. Please check browser compatibility`;
                                    }

                                    return undefined;
                                })()}
                            >
                                <div>
                                    <CoreButton
                                        icon
                                        pill
                                        size="small"
                                        shape="ghost"
                                        disabled={loadingCreatePsbt || !!cameraPermissionError}
                                        onClick={() => {
                                            setQrCodeModal(true);
                                        }}
                                    >
                                        <Icon
                                            className="color-weak"
                                            name="qr-code"
                                            size={5}
                                            alt={c('Bitcoin send').t`Open QR code reader`}
                                        />
                                    </CoreButton>
                                </div>
                            </Tooltip>
                        }
                    />
                </div>
            </Prompt>

            {renderConfirmModal && psbt && (
                <Prompt
                    buttons={[
                        <Button
                            fullWidth
                            size="large"
                            shape="solid"
                            color="norm"
                            disabled={privateKey === '' || !!error}
                            onClick={() => {
                                void withLoadingCreatePsbt(onPaperWalletSubmit());
                            }}
                        >
                            {c('Sweep paper wallet').t`Confirm and import`}
                        </Button>,
                        <Button
                            fullWidth
                            className="mx-auto"
                            size="large"
                            shape="solid"
                            color="weak"
                            onClick={() => {
                                confirmModal.onClose();
                            }}
                        >{c('Sweep paper wallet').t`Cancel`}</Button>,
                    ]}
                    {...confirmModal}
                >
                    {loadingCreatePsbt && (
                        <div
                            className="fixed top-0 left-0 w-full h-full flex flex-column items-center justify-center"
                            style={{ background: 'var(--bg-overlay)', zIndex: 100 }}
                        >
                            <CircleLoader size="medium" className="color-primary" />
                        </div>
                    )}
                    <div className="max-w-full">
                        <div className="my-8">
                            <div className="flex flex-row items-center">
                                <span className="block color-weak">{c('Sweep paper wallet').t`You receive`}</span>
                            </div>
                            {outputsAmount && (
                                <>
                                    <div className="flex flex-row flex-nowrap items-center my-1">
                                        <div className="text-semibold">
                                            <Price
                                                unit={exchangeRateOrBitcoinUnit}
                                                className="h1 text-semibold"
                                                wrapperClassName="contrast"
                                                amount={outputsAmount.valueOf()}
                                            />
                                        </div>
                                    </div>
                                    {exchangeRate && (
                                        <div className="text-lg color-hint">
                                            <MaybeHiddenAmount>
                                                {convertAmountStr(
                                                    outputsAmount.valueOf(),
                                                    COMPUTE_BITCOIN_UNIT,
                                                    settings.BitcoinUnit
                                                )}
                                            </MaybeHiddenAmount>{' '}
                                            {getLabelByUnit(settings.BitcoinUnit)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {publicAddress && (
                            <>
                                <div key={0} className="flex flex-row w-full items-center my-1">
                                    <button
                                        className="flex flex-row flex-nowrap items-center w-full"
                                        onClick={() => {
                                            setRecipientDetailsModal({
                                                recipient: {
                                                    Address: publicAddress,
                                                    Name: publicAddress,
                                                },
                                                btcAddress: publicAddress,
                                                index: 0,
                                            });
                                        }}
                                    >
                                        <div className="flex flex-column items-start grow mr-2">
                                            <span className="block color-weak">{c('Wallet transaction').t`From`}</span>

                                            <Tooltip title={publicAddress}>
                                                <MiddleEllipsis text={publicAddress} className="w-2/3 text-lg my-1" />
                                            </Tooltip>
                                        </div>
                                        <Icon className="ml-2 shrink-0" name="chevron-right" />
                                    </button>
                                </div>
                                <hr className="my-4 sweep-paper-wallet-hr" />
                            </>
                        )}
                        <div className="flex flex-column items-start grow mr-4">
                            <span className="block color-weak">{c('Wallet transaction').t`To`}</span>
                            <ul className="unstyled my-0 text-lg w-full">
                                <li className="flex flex-column my-1">
                                    <Tooltip title={recipient}>
                                        <span className="block w-full text-ellipsis">{recipient}</span>
                                    </Tooltip>
                                </li>
                            </ul>
                        </div>
                        <hr className="my-4 sweep-paper-wallet-hr" />
                        <div className="flex flex-column w-full">
                            <div className="flex flex-row w-full items-center justify-space-between">
                                <div className="flex flex-column items-start">
                                    <div className="color-weak mb-2">{c('Wallet transaction').t`Network fee`}</div>
                                    <div className="mb-1">
                                        <Price
                                            amount={Number(psbt.total_fees)}
                                            unit={exchangeRate ?? exchangeRateOrBitcoinUnit}
                                        />
                                    </div>
                                    <span className="block color-hint text-nowrap">
                                        <SecondaryAmount
                                            key="hint-fiat-amount"
                                            settingsBitcoinUnit={settings.BitcoinUnit}
                                            secondaryExchangeRate={exchangeRate}
                                            primaryExchangeRate={exchangeRateOrBitcoinUnit}
                                            value={Number(psbt.total_fees)}
                                            unitValue={'SATS' as WasmBitcoinUnit}
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Prompt>
            )}

            {renderQrCodeModal && (
                <QRCodeReaderModal
                    onScan={handleScan}
                    onError={(name) => {
                        setCameraPermissionError(name);
                    }}
                    {...qrCodeModal}
                />
            )}

            {recipientDetailsModal.data && (
                <RecipientDetailsModal {...recipientDetailsModal.data} {...recipientDetailsModal} />
            )}
        </>
    );
};
