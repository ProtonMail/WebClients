import { useState } from 'react';

import compact from 'lodash/compact';
import { c } from 'ttag';

import { type WasmTransactionDetails } from '@proton/andromeda';
import { Icon, useModalStateWithData } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import arrowReceiveDarkSvg from '@proton/styles/assets/img/illustrations/arrow-receive-dark.svg';
import arrowReceiveSvg from '@proton/styles/assets/img/illustrations/arrow-receive.svg';
import arrowSendDarkSvg from '@proton/styles/assets/img/illustrations/arrow-send-dark.svg';
import arrowSendSvg from '@proton/styles/assets/img/illustrations/arrow-send.svg';
import { COMPUTE_BITCOIN_UNIT, type TransactionData } from '@proton/wallet';
import { useApiWalletTransactionData, useUserWalletSettings } from '@proton/wallet/store';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { CoreButton } from '../../atoms';
import { MaybeHiddenAmount } from '../../atoms/MaybeHiddenAmount';
import { Price } from '../../atoms/Price';
import { useWalletTheme } from '../../components/Layout/Theme/WalletThemeProvider';
import type { RecipientDetailsModalOwnProps } from '../../components/RecipientDetailsModal';
import { RecipientDetailsModal } from '../../components/RecipientDetailsModal';
import { convertAmountStr, getLabelByUnit } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';
import {
    AmountDataItem,
    DateDataItem,
    LinkToBlockchainDataItem,
    MessageDataItem,
    NoteDataItem,
    RecipientsDataItem,
    SendersDataItem,
    StatusDataItem,
} from './data-items';

interface Props {
    transactionDataKey: string;
    networkDataAndHashedTxId: [WasmTransactionDetails, string];
    onClickEditNote: () => void;
    onClickEditSender: () => void;
    onClose: () => void;
}

export const WalletTransactionDataDrawer = ({
    transactionDataKey: transactionDataKey,
    networkDataAndHashedTxId: [networkData],
    onClickEditNote,
    onClickEditSender,
    onClose,
}: Props) => {
    const theme = useWalletTheme();
    const [transactionsFromStore] = useApiWalletTransactionData(compact([transactionDataKey]));
    const apiData = transactionsFromStore?.[transactionDataKey] ?? null;

    const [showMore, setShowMore] = useState(false);
    const { network } = useBitcoinBlockchainContext();
    const exchangeRate = apiData?.ExchangeRate ?? undefined;
    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<RecipientDetailsModalOwnProps>();

    const [settings] = useUserWalletSettings();

    const isSender = networkData.is_send;

    /**
     * If user is sender, we want to display what the amount he actually sent, without change output amount and fees
     * If user is recipient, we want to the amount he received
     */
    const value = networkData.value;

    const transactionData: TransactionData = { networkData, apiData };

    return (
        <>
            <div className="flex flex-column mb-10">
                <div className="flex flex-row items-center">
                    {isSender ? (
                        <img
                            src={theme === WalletThemeOption.WalletDark ? arrowSendDarkSvg : arrowSendSvg}
                            alt=""
                            className="mr-3"
                            style={{ width: '1.4rem' }}
                        />
                    ) : (
                        <img
                            src={theme === WalletThemeOption.WalletDark ? arrowReceiveDarkSvg : arrowReceiveSvg}
                            alt=""
                            className="mr-2"
                            style={{ width: '1.4rem' }}
                        />
                    )}
                    <div className="color-hint block text-ellipsis">
                        {isSender ? c('Wallet transaction').t`You sent` : c('Wallet transaction').t`You received`}
                    </div>
                </div>

                <div className="flex flex-row flex-nowrap items-center my-1">
                    <div className="text-semibold">
                        <Price
                            unit={exchangeRate ?? settings.BitcoinUnit}
                            className="h1 text-semibold"
                            wrapperClassName="contrast"
                            amount={value}
                        />
                    </div>
                </div>

                {exchangeRate && (
                    <div className="text-lg color-hint">
                        <MaybeHiddenAmount>
                            {convertAmountStr(value, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}
                        </MaybeHiddenAmount>{' '}
                        {getLabelByUnit(settings.BitcoinUnit)}
                    </div>
                )}
            </div>

            <RecipientsDataItem
                tx={transactionData}
                onClick={(email, btcAddress, index) =>
                    btcAddress &&
                    setRecipientDetailsModal({ recipient: { Address: email, Name: email }, btcAddress, index })
                }
            />

            <hr className="my-4" />
            <SendersDataItem
                tx={transactionData}
                onClickEditSender={() => {
                    onClickEditSender();
                }}
            />

            <DateDataItem tx={transactionData} />

            <hr className="my-4" />
            <StatusDataItem tx={transactionData} onBoost={() => onClose()} />

            {apiData?.Body && (
                <>
                    <hr className="my-4" />
                    <MessageDataItem tx={transactionData} />
                </>
            )}

            <hr className="my-4" />

            <NoteDataItem
                tx={transactionData}
                onClick={() => {
                    onClickEditNote();
                }}
            />
            <hr className="my-4" />

            {showMore ? (
                <>
                    <AmountDataItem
                        amount={networkData.fee}
                        label={c('Wallet transaction').t`Network fee`}
                        exchangeRate={exchangeRate}
                        infoTitle={c('Wallet info')
                            .t`This fee incentivizes Bitcoin miners to include your transaction in the blockchain. None of the fee goes to ${BRAND_NAME}.`}
                    />

                    <hr className="my-4" />

                    <AmountDataItem
                        amount={(networkData.fee ?? 0) + value}
                        label={c('Wallet transaction').t`Total (sent amount + fee)`}
                        exchangeRate={exchangeRate}
                    />

                    <LinkToBlockchainDataItem tx={transactionData} network={network} />
                </>
            ) : (
                <div>
                    <CoreButton shape="ghost" size="small" className="color-hint" onClick={() => setShowMore(true)}>
                        {c('Wallet transaction').t`View more`} <Icon name="chevron-down" size={3} />
                    </CoreButton>
                </div>
            )}

            {recipientDetailsModal.data && (
                <RecipientDetailsModal {...recipientDetailsModal.data} {...recipientDetailsModal} />
            )}
        </>
    );
};
