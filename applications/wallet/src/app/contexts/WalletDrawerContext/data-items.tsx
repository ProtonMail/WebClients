import { c } from 'ttag';

import { WasmApiExchangeRate } from '@proton/andromeda';
import { Icon, Price, Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../../atoms';
import {
    TxDataListItemProps,
    TxDataWithExchangeRateListItemProps,
} from '../../components/TransactionList/data-list-items';
import { TransactionData } from '../../hooks/useWalletTransactions';
import { satsToBitcoin, satsToFiat } from '../../utils';
import { multilineStrToMultilineJsx } from '../../utils/string';

export const RecipientsDataListItem = ({ tx }: TxDataListItemProps) => {
    const isSentTx = tx.networkData.sent > tx.networkData.received;

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`To`}</span>
            <ul className="unstyled mt-1 text-lg">
                {tx.networkData.outputs
                    .filter((o) => !isSentTx || !o.is_mine)
                    .map((output, index) => (
                        <li key={index} className="flex flex-column my-1">
                            {tx.apiData?.ToList[output.address] && (
                                <Tooltip title={tx.apiData?.ToList[output.address]}>
                                    <span className="block w-full text-ellipsis">
                                        {tx.apiData?.ToList[output.address]}
                                    </span>
                                </Tooltip>
                            )}

                            <Tooltip title={output.address}>
                                <span className="block w-full text-ellipsis color-weak">{output.address}</span>
                            </Tooltip>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export const SendersDataListItem = ({ tx }: TxDataListItemProps) => {
    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`From`}</span>
            <ul className="unstyled mt-1 text-lg">
                {tx.apiData?.Sender ? (
                    <li className="flex flex-column my-1">
                        <Tooltip title={tx.apiData?.Sender}>
                            <span className="block w-full text-ellipsis">{tx.apiData?.Sender}</span>
                        </Tooltip>
                    </li>
                ) : (
                    tx.networkData.inputs.map((input, index) => (
                        <li key={index} className="flex flex-column my-1">
                            <Tooltip title={input.previous_output?.address ?? '-'}>
                                <span className="block w-full text-ellipsis color-weak">
                                    {input.previous_output?.address ?? '-'}
                                </span>
                            </Tooltip>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export const NoteDataListItem = ({ tx, onClick }: TxDataListItemProps & { onClick: (tx: TransactionData) => void }) => {
    return (
        <div className="w-full max-h-custom overflow-auto" style={{ '--max-h-custom': '8rem' }}>
            <div className="flex flex-row items-center">
                <span className="block color-hint text-rg">{c('Wallet transaction').t`Note`}</span>
                {tx.apiData?.Label && (
                    <CoreButton
                        size="small"
                        shape="ghost"
                        color="weak"
                        className="p-1 ml-2 color-weak"
                        onClick={() => onClick(tx)}
                        icon
                    >
                        <Icon size={3} name="pen-square" className="color-hint" />
                    </CoreButton>
                )}
            </div>
            <div className="w-full flex">
                {tx.apiData?.Label ? (
                    <p className="color-weak block text-ellipsis">
                        {multilineStrToMultilineJsx(tx.apiData.Label, 'transaction-label')}
                    </p>
                ) : (
                    <CoreButton
                        shape="ghost"
                        className="p-0.5"
                        style={{
                            color: 'var(--interaction-norm)',
                            background: 'transparent',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(tx);
                        }}
                    >
                        {c('Wallet transaction').t`+ Add`}
                    </CoreButton>
                )}
            </div>
        </div>
    );
};

export const MessageDataListItem = ({ tx }: TxDataListItemProps) => {
    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`Message`}</span>
            <p className="text-lg">{tx.apiData?.Body}</p>
        </div>
    );
};

export const AmountDataListItem = ({
    exchangeRate,
    amount,
    label = c('Wallet transaction').t`Amount`,
}: {
    amount?: number | null;
    label?: string;
    exchangeRate?: WasmApiExchangeRate;
}) => {
    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{label}</span>
            <div className="flex flex-row flex-nowrap items-center mt-1 text-lg">
                <div className={clsx('text-semibold', !exchangeRate && 'skeleton-loader')}>
                    <Price currency={exchangeRate?.FiatCurrency}>
                        {exchangeRate ? satsToFiat(amount ?? 0, exchangeRate).toFixed(2) : '-'}
                    </Price>
                </div>
            </div>
            <div className="color-weak">{satsToBitcoin(amount ?? 0)} BTC</div>
        </div>
    );
};

export const NetworkFeesDataListItem = ({ tx, exchangeRate }: TxDataWithExchangeRateListItemProps) => {
    const fees = tx.networkData.fee;

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`Network fee`}</span>
            <div className="flex flex-row flex-nowrap items-center mt-1 text-lg">
                <div className={clsx('text-semibold', !exchangeRate && 'skeleton-loader')}>
                    <Price currency={exchangeRate?.FiatCurrency}>
                        {exchangeRate ? satsToFiat(fees ?? 0, exchangeRate).toFixed(2) : '-'}
                    </Price>
                </div>
            </div>
            <div className="color-weak">{satsToBitcoin(fees ?? 0)} BTC</div>
        </div>
    );
};

export const TotalSentAmountDataListItem = ({ tx, exchangeRate }: TxDataWithExchangeRateListItemProps) => {
    const value = tx.networkData.fee ?? 0 + tx.networkData.sent;

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`Total (sent amount + fee)`}</span>
            <div className="flex flex-row flex-nowrap items-center mt-1 text-lg">
                <div className={clsx('text-semibold', !exchangeRate && 'skeleton-loader')}>
                    <Price currency={exchangeRate?.FiatCurrency}>
                        {exchangeRate ? satsToFiat(value, exchangeRate).toFixed(2) : '-'}
                    </Price>
                </div>
            </div>
            <div className="color-weak">{satsToBitcoin(value)} BTC</div>
        </div>
    );
};
