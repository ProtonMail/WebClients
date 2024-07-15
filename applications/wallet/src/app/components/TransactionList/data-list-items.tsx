import { CSSProperties, useMemo } from 'react';

import { c } from 'ttag';

import { WasmApiExchangeRate } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { useAddresses } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import arrowReceiveSvg from '@proton/styles/assets/img/illustrations/arrow-receive.svg';
import arrowSendSvg from '@proton/styles/assets/img/illustrations/arrow-send.svg';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT, useUserWalletSettings } from '@proton/wallet';

import { Price } from '../../atoms/Price';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { TransactionData } from '../../hooks/useWalletTransactions';
import {
    convertAmountStr,
    getFormattedPeriodSinceConfirmation,
    getLabelByUnit,
    getTransactionMessage,
    getTransactionRecipientsHumanReadableName,
    getTransactionSenderHumanReadableName,
} from '../../utils';
import { DataListItem } from '../DataList';

export interface TxDataListItemProps {
    tx: TransactionData;
    loading?: boolean;
}

export interface TxDataWithExchangeRateListItemProps extends TxDataListItemProps {
    exchangeRate?: WasmApiExchangeRate;
}

export const ConfirmationTimeDataListItem = ({ tx, loading }: TxDataListItemProps) => {
    const { isNarrow } = useResponsiveContainerContext();
    const now = useMemo(() => new Date(), []);
    const value = tx.networkData.received - tx.networkData.sent;

    const confirmedDate =
        tx.networkData.time.confirmation_time &&
        getFormattedPeriodSinceConfirmation(now, new Date(tx.networkData.time.confirmation_time * SECOND));

    const imgClassName = clsx('shrink-0', isNarrow ? 'mr-2' : 'mr-4');
    const imgStyle: CSSProperties = isNarrow ? { width: '1.5rem' } : { width: '2rem' };

    return (
        <DataListItem
            label={value >= 0 ? 'Received' : 'Sent'}
            leftIcon={
                value >= 0 ? (
                    <img src={arrowReceiveSvg} alt="" className={imgClassName} style={imgStyle} />
                ) : (
                    <img src={arrowSendSvg} alt="" className={imgClassName} style={imgStyle} />
                )
            }
            bottomNode={
                <div className={clsx(loading && 'skeleton-loader')}>
                    {confirmedDate ? (
                        <span className="color-hint block text-ellipsis">{confirmedDate}</span>
                    ) : (
                        <div className="flex flex-row flex-nowrap items-center color-primary">
                            <CircleLoader className="shrink-0" />
                            <div className="ml-2 text-ellipsis">{c('Wallet transaction').t`In progress`}</div>
                        </div>
                    )}
                </div>
            }
        />
    );
};

export const SenderOrRecipientDataListItem = ({ tx, loading }: TxDataListItemProps) => {
    const isSent = tx.networkData.sent > tx.networkData.received;
    const [addresses] = useAddresses();
    const { walletMap } = useBitcoinBlockchainContext();

    const transactionRecipientsHumanReadableNameList = isSent
        ? getTransactionRecipientsHumanReadableName(tx, walletMap, addresses).join(', ')
        : getTransactionSenderHumanReadableName(tx, walletMap);

    const message = getTransactionMessage(tx);

    const senderOrRecipientName = <span className="text-ellipsis">{transactionRecipientsHumanReadableNameList}</span>;

    return (
        <DataListItem
            label={
                <div className={clsx('block text-ellipsis', loading && 'skeleton-loader')}>
                    <span>
                        {
                            // transalators: example translation -> To: bob@proton.me / From: alice@proton.me
                            isSent
                                ? c('Wallet transaction').jt`To: ${senderOrRecipientName}`
                                : c('Wallet transaction').jt`From: ${senderOrRecipientName}`
                        }
                    </span>
                </div>
            }
            bottomNode={
                message && (
                    <div className={clsx('color-weak block text-ellipsis', loading && 'skeleton-loader')}>
                        {message}
                    </div>
                )
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
            className="pl-2"
            bottomNode={
                <div className={clsx('flex items-center', loading && 'skeleton-loader')}>
                    <button
                        className={clsx(
                            'py-0.5 px-2 block text-ellipsis relative rounded-sm interactive-pseudo-inset',
                            tx.apiData?.Label ? 'color-weak' : 'color-primary'
                        )}
                        style={{
                            color: !tx.apiData?.Label && 'var(--interaction-norm-major-3)',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(tx);
                        }}
                    >
                        {tx.apiData?.Label || c('Wallet transaction').t`+ Add`}
                    </button>
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
    const [settings] = useUserWalletSettings();
    const value = tx.networkData.received - tx.networkData.sent;

    const bitcoinUnit = settings.BitcoinUnit;

    return (
        <DataListItem
            align="end"
            label={
                <div className={clsx('ml-auto flex flex-row flex-nowrap', loadingLabel && 'skeleton-loader')}>
                    {loadingLabel ? (
                        <span>{c('Wallet transaction').t`Loading`}</span>
                    ) : (
                        <Price
                            unit={exchangeRate ?? bitcoinUnit}
                            satsAmount={value}
                            withPositiveSign
                            signClassName={value < 0 ? 'color-danger' : 'color-success'}
                        />
                    )}
                </div>
            }
            bottomNode={
                !loadingLabel &&
                exchangeRate && (
                    <div
                        className={clsx(
                            'block ml-auto color-hint flex flex-row flex-nowrap',
                            loading && 'skeleton-loader'
                        )}
                    >
                        <span className={clsx('text-ellipsis')}>
                            {convertAmountStr(value, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                            {getLabelByUnit(settings.BitcoinUnit)}
                        </span>
                    </div>
                )
            }
        />
    );
};
