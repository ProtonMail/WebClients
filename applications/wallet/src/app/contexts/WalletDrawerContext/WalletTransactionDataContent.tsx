import { useState } from 'react';

import { c } from 'ttag';

import { Icon, useModalStateWithData } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import arrowReceiveSvg from '@proton/styles/assets/img/illustrations/arrow-receive.svg';
import arrowSendSvg from '@proton/styles/assets/img/illustrations/arrow-send.svg';
import { COMPUTE_BITCOIN_UNIT, useUserWalletSettings } from '@proton/wallet';

import { CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import type { RecipientDetailsModalOwnProps } from '../../components/RecipientDetailsModal';
import { RecipientDetailsModal } from '../../components/RecipientDetailsModal';
import type { TransactionData } from '../../hooks/useWalletTransactions';
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
    transaction: TransactionData;
    onClickEditNote: () => void;
    onClickEditSender: () => void;
}

export const WalletTransactionDataDrawer = ({ transaction, onClickEditNote, onClickEditSender }: Props) => {
    const [showMore, setShowMore] = useState(false);
    const { network } = useBitcoinBlockchainContext();
    const exchangeRate = transaction.apiData?.ExchangeRate ?? undefined;
    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<RecipientDetailsModalOwnProps>();

    const [settings] = useUserWalletSettings();

    const isSender = transaction.networkData.sent > transaction.networkData.received;
    /**
     * If user is sender, we want to display what the amount he actually sent, without change output amount and feees
     * If user is recipient, we want to the amount he received
     */
    const value = isSender
        ? transaction.networkData.sent - (transaction.networkData.fee ?? 0) - transaction.networkData.received
        : transaction.networkData.received - transaction.networkData.sent;

    return (
        <>
            <div className="flex flex-column mb-10">
                <div className="flex flex-row items-center">
                    {isSender ? (
                        <img src={arrowSendSvg} alt="" className="mr-3" style={{ width: '1.4rem' }} />
                    ) : (
                        <img src={arrowReceiveSvg} alt="" className="mr-2" style={{ width: '1.4rem' }} />
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
                            satsAmount={value}
                        />
                    </div>
                </div>

                {exchangeRate && (
                    <div className="text-lg color-hint">
                        {convertAmountStr(value, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                        {getLabelByUnit(settings.BitcoinUnit)}
                    </div>
                )}
            </div>

            <RecipientsDataItem
                tx={transaction}
                onClick={(email, btcAddress, index) =>
                    setRecipientDetailsModal({ recipient: { Address: email, Name: email }, btcAddress, index })
                }
            />

            <hr className="my-4" />
            <SendersDataItem
                tx={transaction}
                onClickEditSender={() => {
                    onClickEditSender();
                }}
            />

            <DateDataItem tx={transaction} />

            <hr className="my-4" />
            <StatusDataItem tx={transaction} />

            {transaction.apiData?.Body && (
                <>
                    <hr className="my-4" />
                    <MessageDataItem tx={transaction} />
                </>
            )}

            <hr className="my-4" />

            <NoteDataItem
                tx={transaction}
                onClick={() => {
                    onClickEditNote();
                }}
            />
            <hr className="my-4" />

            {showMore ? (
                <>
                    <AmountDataItem
                        amount={transaction.networkData.fee}
                        label={c('Wallet transaction').t`Network fee`}
                        exchangeRate={exchangeRate}
                        infoTitle={c('Wallet info')
                            .t`This fee incentivizes Bitcoin miners to include your transaction in the blockchain. None of the fee goes to ${BRAND_NAME}.`}
                    />

                    <hr className="my-4" />

                    <AmountDataItem
                        amount={(transaction.networkData.fee ?? 0) + value}
                        label={c('Wallet transaction').t`Total (sent amount + fee)`}
                        exchangeRate={exchangeRate}
                    />

                    <LinkToBlockchainDataItem tx={transaction} network={network} />
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
