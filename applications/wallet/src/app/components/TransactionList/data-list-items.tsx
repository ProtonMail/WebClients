import { c, msgid } from 'ttag';

import { WasmApiExchangeRate } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Price } from '@proton/components/components';
import { SECOND } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../../atoms';
import { TransactionData } from '../../hooks/useWalletTransactions';
import { getFormattedPeriodSinceConfirmation, satsToFiat } from '../../utils';
import { DataListItem } from '../DataList';
import arrowReceiveSvg from './arrow-receive.svg';
import arrowSendSvg from './arrow-send.svg';

export interface TxDataListItemProps {
    tx: TransactionData;
    loading?: boolean;
}

export interface TxDataWithExchangeRateListItemProps extends TxDataListItemProps {
    exchangeRate?: WasmApiExchangeRate;
}

export const ConfirmationTimeDataListItem = ({ tx, loading }: TxDataListItemProps) => {
    const now = new Date();
    const value = tx.networkData.received - tx.networkData.sent;

    const confirmedDate =
        tx.networkData.time.confirmation_time &&
        getFormattedPeriodSinceConfirmation(now, new Date(tx.networkData.time.confirmation_time * SECOND));

    return (
        <DataListItem
            label={value >= 0 ? 'Received' : 'Sent'}
            leftIcon={
                value >= 0 ? (
                    <img
                        src={arrowReceiveSvg}
                        alt="A green arrow going down, symbolising money entering wallet"
                        className="mr-4"
                    />
                ) : (
                    <img
                        src={arrowSendSvg}
                        alt="A red arrow going down, symbolising money leaving wallet"
                        className="mr-4"
                    />
                )
            }
            bottomNode={
                <div className={clsx(loading && 'skeleton-loader')} style={{ height: '1.5rem' }}>
                    {confirmedDate ? (
                        <span className="color-hint block text-ellipsis">{confirmedDate}</span>
                    ) : (
                        <div className="flex flex-row items-center color-primary">
                            <CircleLoader />
                            <div className="ml-2">{c('Wallet transaction').t`In progress`}</div>
                        </div>
                    )}
                </div>
            }
        />
    );
};

export const SenderOrRecipientDataListItem = ({ tx, loading }: TxDataListItemProps) => {
    const isReceivedTx = tx.networkData.received > tx.networkData.sent;

    const outputsWithProtonRecipient = tx.networkData.outputs.map(
        (o) => [o.address, tx.apiData?.ToList[o.address]] as const
    );
    const firstOutputWithProtonRecipient = outputsWithProtonRecipient.find((o): o is [string, string] => !!o[1]);

    return (
        <DataListItem
            label={
                isReceivedTx
                    ? c('Wallet transactions').ngettext(msgid`Sender`, `Senders`, tx.networkData.inputs.length)
                    : c('Wallet transactions').ngettext(msgid`Recipient`, `Recipients`, tx.networkData.outputs.length)
            }
            bottomNode={
                <div
                    className={clsx('color-hint block text-ellipsis', loading && 'skeleton-loader')}
                    style={{ height: '1.5rem' }}
                >
                    {isReceivedTx
                        ? tx.apiData?.Sender ?? tx.networkData.inputs[0].previous_output?.address ?? '-'
                        : firstOutputWithProtonRecipient?.[1] ?? outputsWithProtonRecipient[0][0] ?? '-'}
                </div>
            }
        />
    );
};

export const NoteDataListItem = ({
    tx,
    loading,
    onClick,
}: TxDataListItemProps & { onClick: (tx: TransactionData) => void }) => {
    return (
        <DataListItem
            label="Note"
            bottomNode={
                <div className={clsx('flex items-center', loading && 'skeleton-loader')} style={{ height: '1.5rem' }}>
                    <CoreButton
                        shape="ghost"
                        color={tx.apiData?.Label ? 'weak' : 'norm'}
                        className="p-0.5 color-hint block text-ellipsis"
                        style={{
                            color: !tx.apiData?.Label && 'var(--interaction-norm)',
                            background: 'transparent',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(tx);
                        }}
                    >
                        {tx.apiData?.Label || c('Wallet transaction').t`+ Add`}
                    </CoreButton>
                </div>
            }
        />
    );
};

export const AmountDataListItem = ({
    tx,
    loading,
    loadingLabel,
    exchangeRate,
}: TxDataWithExchangeRateListItemProps & { loadingLabel?: boolean }) => {
    const value = tx.networkData.received - tx.networkData.sent;

    return (
        <DataListItem
            align="end"
            label={
                <div className={clsx('ml-auto', loadingLabel && 'skeleton-loader')}>
                    {exchangeRate ? (
                        <Price currency={exchangeRate.FiatCurrency} divisor={1}>
                            {satsToFiat(value, exchangeRate)}
                        </Price>
                    ) : (
                        <span>Loading</span>
                    )}
                </div>
            }
            bottomNode={
                <div
                    className={clsx('block ml-auto color-hint', loading && 'skeleton-loader')}
                    style={{ height: '1.5rem' }}
                >
                    {value} SATS
                </div>
            }
        />
    );
};
