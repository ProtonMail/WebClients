import { useMemo, useState } from 'react';

import compact from 'lodash/compact';
import isUndefined from 'lodash/isUndefined';
import noop from 'lodash/noop';
import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useAddresses } from '@proton/account/addresses/hooks';
import { Slider } from '@proton/atoms/index';
import { type ModalStateProps, useNotifications, useUserKeys } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { type Address } from '@proton/shared/lib/interfaces';
import walletClock from '@proton/styles/assets/img/wallet/wallet-clock.jpg';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT, type TransactionData, useWalletApiClients } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet/store';

import { Button, Modal } from '../../atoms';
import { Price } from '../../atoms/Price';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useGetRecipientVerifiedAddressKey } from '../../hooks/useGetRecipientVerifiedAddressKey';
import {
    convertAmountStr,
    getAccountWithChainDataFromManyWallets,
    getLabelByUnit,
    signAndBroadcastPsbt,
} from '../../utils';
import {
    findNearestBlockTargetFeeRate,
    findQuickestBlock,
    useFees,
} from '../BitcoinSendModal/TransactionReviewStep/useFeesInput';

interface Props extends ModalStateProps {
    transaction: TransactionData;
    onBoost: () => void;
}

export const BoostTransactionModal = ({ transaction, onBoost, ...modalProps }: Props) => {
    const [loading, withLoading] = useLoading();
    const blockchainClient = useBlockchainClient();
    const { network, walletsChainData, walletMap, syncSingleWalletAccount } = useBitcoinBlockchainContext();
    const { createNotification } = useNotifications();
    const walletApiClients = useWalletApiClients();

    const [userKeys] = useUserKeys();
    const [addresses] = useAddresses();
    const getAddressKeys = useGetAddressKeys();

    const getRecipientVerifiedAddressKey = useGetRecipientVerifiedAddressKey();

    const { feesList } = useFees();
    const feeRateForNextBlock = useMemo(() => findNearestBlockTargetFeeRate(1, feesList), [feesList]);

    const exchangeRate = transaction.apiData?.ExchangeRate;
    const currentFees = transaction.networkData.fee ?? 0;

    const transactionSize = transaction.networkData.size;

    const feesForNextBlock = Math.ceil(transactionSize * (feeRateForNextBlock ?? 1));

    // Min RBF FeeRate should 1sat/vbytes superior to replaced transaction feeRate
    const min = Math.ceil(currentFees + transactionSize);
    const max = Math.max(Math.ceil(currentFees * 3), feesForNextBlock * 2);
    // We want the slider to be set to 1/3
    const initialValue = Math.ceil(min + (max - min) / 3);

    const [feesValue, setFeesValue] = useState<number>(initialValue);

    const [confirmationTimeEstimation, label] = useMemo(() => {
        const feeRate = Math.ceil(feesValue / transactionSize);
        const quickestBlock = findQuickestBlock(feeRate, feesList);
        const lowLabel = c('Wallet send').t`Low`;

        if (quickestBlock) {
            const minutes = quickestBlock * 10;
            const label = () => {
                if (quickestBlock < 3) {
                    return c('Wallet send').t`Fast`;
                }
                if (quickestBlock < 10) {
                    return c('Wallet send').t`Normal`;
                }

                return lowLabel;
            };

            return [c('Wallet send').t`~${minutes} minutes`, label()];
        }

        return [c('Wallet send').t`10+ hours`, lowLabel];
    }, [feesList, feesValue, transactionSize]);

    const [settings] = useUserWalletSettings();

    const handleConfirmBoost = async () => {
        // Typeguard: api part should be created when transaction is bumped
        if (!transaction.apiData) {
            return;
        }

        const txid = transaction.apiData?.TransactionID;
        const { WalletID, WalletAccountID } = transaction.apiData;

        const account = getAccountWithChainDataFromManyWallets(
            walletsChainData,
            transaction.apiData.WalletID,
            transaction.apiData.WalletAccountID
        );

        if (isUndefined(network) || !userKeys || !account || !txid || !WalletID || !WalletAccountID) {
            return;
        }

        const apiWalletData = walletMap[WalletID]?.wallet;
        const apiAccount = walletMap[WalletID]?.accounts[WalletAccountID];

        if (!apiWalletData || !apiAccount) {
            return;
        }

        const recipients = transaction.apiData.ToList;
        const recipientsEncryptionKeys = compact(
            await Promise.all(
                Object.values(recipients).map((recipient) => recipient && getRecipientVerifiedAddressKey(recipient))
            )
        );

        const { Sender } = transaction.apiData;
        const senderAddress: Address | undefined = addresses?.find(
            (address) => address.Email === (typeof Sender === 'string' ? Sender : Sender?.email)
        );

        const senderAddressKey = senderAddress && (await getAddressKeys(senderAddress.ID)).at(0);

        const message = transaction.apiData?.Body
            ? { content: transaction.apiData.Body, encryptionKeys: [...recipientsEncryptionKeys] }
            : undefined;

        try {
            const psbt = await account.account.bumpTransactionsFees(network, txid, BigInt(feesValue));

            await signAndBroadcastPsbt({
                psbt,
                blockchainClient,
                network,
                userKeys,

                walletsChainData,
                apiWalletData,
                apiAccount,

                exchangeRateId: transaction.apiData?.ExchangeRate?.ID,
                noteToSelf: transaction.apiData?.Label ?? undefined,

                senderAddress: senderAddressKey ? { ID: senderAddress.ID, key: senderAddressKey } : undefined,
                message,
                recipients,
                isAnonymousSend: transaction.apiData.Type === 'ProtonToProtonSend' && !transaction.apiData.Sender,

                onBroadcastedTx: () => {
                    void syncSingleWalletAccount({
                        walletId: apiAccount.WalletID,
                        accountId: apiAccount.ID,
                        manual: true,
                    });

                    if (transaction.apiData) {
                        void walletApiClients.wallet
                            .deleteWalletTransaction(apiAccount.WalletID, apiAccount.ID, transaction.apiData.ID)
                            // gracefully handle error
                            .catch(noop);
                    }

                    onBoost();
                    modalProps.onClose?.();
                },
            });

            await createNotification({
                text: c('Wallet send').t`Transaction was successfully boosted`,
            });
        } catch (error: any) {
            createNotification({
                type: 'error',
                text:
                    error?.error ??
                    c('Wallet send').t`Could not speed up transaction. Please sync your wallet and try again`,
            });
        }
    };

    return (
        <Modal {...modalProps} className="prompt" size="small">
            <div className="flex flex-column items-center gap-4">
                <img className="w-custom" style={{ '--w-custom': '15rem' }} src={walletClock} alt="" />
                <h1 className={clsx('text-semibold text-break text-3xl')}>{c('Wallet send')
                    .t`Boost transaction priority`}</h1>
                <p className="text-center color-weak m-0">{c('Wallet send')
                    .t`By increasing the fee, you can prioritize your transaction, helping it get confirmed faster during busy network times.`}</p>

                <div className="w-full flex flex-column gap-2">
                    <div className="w-full flex flex-row justify-space-between items-center">
                        <label className="text-lg">{c('Wallet send').t`Current fee`}</label>

                        <div className="flex flex-column items-end">
                            <div className="flex flex-row flex-nowrap items-center text-lg my-1">
                                <Price unit={exchangeRate ?? settings.BitcoinUnit} amount={currentFees ?? 0} />
                            </div>

                            {exchangeRate && (
                                <div className="color-hint">
                                    {convertAmountStr(currentFees ?? 0, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                                    {getLabelByUnit(settings.BitcoinUnit)}
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="w-full my-1" />

                    <div className="w-full flex flex-row justify-space-between items-center">
                        <label className="text-lg">{c('Wallet send').t`New network fee`}</label>

                        <div className="flex flex-column items-end">
                            <div className="flex flex-row flex-nowrap items-center text-lg my-1">
                                <Price unit={exchangeRate ?? settings.BitcoinUnit} amount={feesValue} />
                            </div>

                            {exchangeRate && (
                                <div className="color-hint">
                                    {convertAmountStr(feesValue ?? 0, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                                    {getLabelByUnit(settings.BitcoinUnit)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full px-2 my-2">
                    <Slider
                        min={min}
                        max={max}
                        step={1}
                        value={feesValue}
                        onChange={(value) => setFeesValue(value)}
                        size="small"
                        color="norm"
                    ></Slider>
                </div>

                <div className="w-full flex flex-row justify-space-between items-center mt-2">
                    <div className="color-weak">{c('Wallet send').t`Confirmation speed: ${label}`}</div>
                    <div className="text-semibold">{confirmationTimeEstimation}</div>
                </div>

                <Button
                    className="mt-4"
                    fullWidth
                    size="large"
                    color="norm"
                    disabled={loading}
                    onClick={() => {
                        void withLoading(handleConfirmBoost());
                    }}
                >{c('Wallet send').t`Increase fee and resend`}</Button>
            </div>
        </Modal>
    );
};
