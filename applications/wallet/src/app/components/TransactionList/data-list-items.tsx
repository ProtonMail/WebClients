import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import type { WasmApiExchangeRate } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import { useAddresses } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import arrowReceiveSvg from '@proton/styles/assets/img/illustrations/arrow-receive.svg';
import arrowSendSvg from '@proton/styles/assets/img/illustrations/arrow-send.svg';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT, type TransactionData } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet/store';

import { Price } from '../../atoms/Price';
import { Skeleton } from '../../atoms/Skeleton';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import {
    convertAmountStr,
    getFormattedPeriodSinceConfirmation,
    getLabelByUnit,
    getTransactionMessage,
    getTransactionRecipientsHumanReadableName,
    getTransactionSenderHumanReadableName,
    getTransactionValue,
    isSentTransaction,
} from '../../utils';
import { DataListItem } from '../DataList';

export interface TxDataListItemProps {
    tx?: TransactionData;
    loadingLabel?: boolean;
    loading?: boolean;
}

export interface TxDataWithExchangeRateListItemProps extends TxDataListItemProps {
    exchangeRate?: WasmApiExchangeRate;
}

export const ConfirmationTimeDataListItem = ({ tx, loadingLabel, loading }: TxDataListItemProps) => {
    const { isNarrow } = useResponsiveContainerContext();
    const now = useMemo(() => new Date(), []);
    const value = getTransactionValue(tx);

    const confirmedDate =
        tx?.networkData.time.confirmation_time &&
        getFormattedPeriodSinceConfirmation(now, new Date(tx.networkData.time.confirmation_time * SECOND));

    const imgClassName = clsx('shrink-0', isNarrow ? 'mr-2' : 'mr-4');
    const imgStyle: CSSProperties = isNarrow
        ? { width: '1.5rem', height: '1.5rem' }
        : { width: '2rem', height: '2rem' };

    return (
        <DataListItem
            label={
                <Skeleton loading={loadingLabel} placeholder={<span>{c('Loader').t`Loading`}</span>}>
                    <span>{value >= 0 ? 'Received' : 'Sent'}</span>
                </Skeleton>
            }
            leftIcon={
                <Skeleton
                    loading={loadingLabel}
                    rounded
                    placeholder={<div className={imgClassName} style={imgStyle} />}
                >
                    <>
                        {value >= 0 ? (
                            <img className={imgClassName} src={arrowReceiveSvg} alt="" style={imgStyle} />
                        ) : (
                            <img className={imgClassName} src={arrowSendSvg} alt="" style={imgStyle} />
                        )}
                    </>
                </Skeleton>
            }
            bottomNode={
                <Skeleton loading={loading} placeholder={<span>{c('Loader').t`Loading data`}</span>}>
                    {confirmedDate ? (
                        isNarrow ? (
                            <Tooltip title={confirmedDate}>
                                <span className="color-hint block text-ellipsis">{confirmedDate}</span>
                            </Tooltip>
                        ) : (
                            <span className="color-hint block text-ellipsis">{confirmedDate}</span>
                        )
                    ) : (
                        <div className="flex flex-row flex-nowrap items-center color-primary">
                            <CircleLoader className="shrink-0" />
                            <div className="ml-2 text-ellipsis">{c('Wallet transaction').t`In progress`}</div>
                        </div>
                    )}
                </Skeleton>
            }
        />
    );
};

export const SenderOrRecipientDataListItem = ({ tx, loading }: TxDataListItemProps) => {
    const isSent = isSentTransaction(tx);
    const [addresses] = useAddresses();
    const { walletMap } = useBitcoinBlockchainContext();

    const transactionRecipientsHumanReadableNameList = (() => {
        if (!tx) {
            return null;
        }

        return isSent
            ? getTransactionRecipientsHumanReadableName(tx, walletMap, addresses).join(', ')
            : getTransactionSenderHumanReadableName(tx, walletMap);
    })();

    const message = tx && getTransactionMessage(tx);

    const senderOrRecipientName = <span className="text-ellipsis">{transactionRecipientsHumanReadableNameList}</span>;

    const senderOrRecipientLabel = isSent
        ? // transalators: example translation -> To: bob@proton.me
          c('Wallet transaction').jt`To: ${senderOrRecipientName}`
        : // transalators: example translation -> From: alice@proton.me
          c('Wallet transaction').jt`From: ${senderOrRecipientName}`;

    return (
        <DataListItem
            label={
                <Skeleton loading={loading} placeholder={<div>{c('Loader').t`Loading send from label`}</div>}>
                    <div className={clsx('block text-ellipsis', loading && 'skeleton-loader')}>
                        <span>{senderOrRecipientLabel}</span>
                    </div>
                </Skeleton>
            }
            bottomNode={
                (message || loading) && (
                    <Skeleton loading={loading} placeholder={<div>{c('Loader').t`Loading message`}</div>}>
                        <Tooltip title={message}>
                            <div className="color-weak block text-ellipsis">{message}</div>
                        </Tooltip>
                    </Skeleton>
                )
            }
        />
    );
};

export const NoteDataListItem = ({
    tx,
    loading,
    loadingLabel,
    onClick,
}: TxDataListItemProps & { onClick?: (tx: TransactionData) => void }) => {
    return (
        <DataListItem
            label={
                <Skeleton loading={loadingLabel}>
                    <span>{c('Wallet transaction').t`Note`}</span>
                </Skeleton>
            }
            bottomNode={
                <Skeleton
                    loading={loading}
                    placeholder={<div className="py-0.5 px-2">{c('Loader').t`Loading data`}</div>}
                >
                    <div className="flex items-center">
                        <Tooltip title={tx?.apiData?.Label}>
                            <button
                                className={clsx(
                                    'py-0.5 px-2 block text-ellipsis relative rounded-sm interactive-pseudo-inset',
                                    tx?.apiData?.Label ? 'color-weak' : 'color-primary'
                                )}
                                style={{
                                    color: !tx?.apiData?.Label && 'var(--interaction-norm-major-3)',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (tx) {
                                        onClick?.(tx);
                                    }
                                }}
                            >
                                {tx?.apiData?.Label || c('Wallet transaction').t`+ Add`}
                            </button>
                        </Tooltip>
                    </div>
                </Skeleton>
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
    const value = getTransactionValue(tx);

    const bitcoinUnit = settings.BitcoinUnit;

    const primaryAmount = (
        <Price
            unit={exchangeRate ?? bitcoinUnit}
            satsAmount={value}
            withPositiveSign
            signClassName={value < 0 ? 'color-danger' : 'color-success'}
        />
    );

    const secondaryAmount = (
        <span className={clsx('text-ellipsis')}>
            {convertAmountStr(value, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)} {getLabelByUnit(settings.BitcoinUnit)}
        </span>
    );

    return (
        <DataListItem
            align="end"
            label={
                <Skeleton
                    loading={loadingLabel}
                    placeholder={<div className="ml-auto text-ellipsis">{c('Loading').t`Amount`}</div>}
                >
                    <div className={clsx('ml-auto flex flex-row flex-nowrap', loadingLabel && 'skeleton-loader')}>
                        {loadingLabel ? <span>{c('Wallet transaction').t`Loading`}</span> : <div>{primaryAmount}</div>}
                    </div>
                </Skeleton>
            }
            bottomNode={
                (loadingLabel || exchangeRate) && (
                    <Skeleton
                        loading={loading || loadingLabel}
                        placeholder={<div className="ml-auto text-ellipsis">{c('Loading').t`Secondary amount`}</div>}
                    >
                        <div>{secondaryAmount}</div>
                    </Skeleton>
                )
            }
        />
    );
};
