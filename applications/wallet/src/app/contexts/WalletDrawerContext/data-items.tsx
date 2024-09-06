import { useMemo } from 'react';

import isUndefined from 'lodash/isUndefined';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmNetwork } from '@proton/andromeda';
import { Href } from '@proton/atoms/Href';
import { Icon, Info, MiddleEllipsis, Tooltip } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT, useUserWalletSettings } from '@proton/wallet';

import { ButtonLike, CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import type { TxDataListItemProps } from '../../components/TransactionList/data-list-items';
import { BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK } from '../../constants';
import type { TransactionData } from '../../hooks/useWalletTransactions';
import {
    convertAmountStr,
    getFormattedPeriodSinceConfirmation,
    getLabelByUnit,
    getTransactionRecipientHumanReadableName,
    getTransactionSenderHumanReadableName,
} from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';

export const RecipientsDataItem = ({
    tx,
    onClick,
}: TxDataListItemProps & { onClick: (email: string, btcAddress: string, index: number) => void }) => {
    const exchangeRate = tx.apiData?.ExchangeRate;
    const isSentTx = tx.networkData.sent > tx.networkData.received;
    const [addresses] = useAddresses();
    const [settings] = useUserWalletSettings();

    const { walletMap } = useBitcoinBlockchainContext();
    const filteredRecipientsList = tx.networkData.outputs.filter(
        (o) =>
            (tx.networkData.outputs.filter((o) => isSentTx && !o.is_mine).length === 0
                ? isSentTx
                : isSentTx && !o.is_mine) ||
            (!isSentTx && o.is_mine)
    );
    const isSingleRecipient = filteredRecipientsList.length === 1;

    return (
        <div className="w-full">
            <ul className="unstyled my-1 flex gap-3">
                {/*
                 * On receive, filter will remove all addresses that do not belong to user.
                 * On send, filter will remove all addresses that belong to user.
                 * Current limitation is, when sending to itself, it will display all addresses in To, even change address.
                 */}
                {filteredRecipientsList.map((output, index) => {
                    const recipient = getTransactionRecipientHumanReadableName(tx, output, walletMap, addresses);
                    const isBtcAddress = recipient == output.address;

                    return (
                        <li key={index} className="flex flex-row w-full items-center my-1">
                            <button
                                className="flex flex-row flex-nowrap items-center w-full"
                                onClick={() => onClick(recipient, output.address, index)}
                            >
                                <div className="flex flex-column items-start grow mr-2">
                                    <span className="block color-weak">{c('Wallet transaction').t`To`}</span>

                                    <Tooltip title={recipient}>
                                        {isBtcAddress ? (
                                            <MiddleEllipsis text={recipient} className="w-2/3 text-lg" />
                                        ) : (
                                            <span className="block text-left w-full text-ellipsis my-1 text-lg">
                                                {recipient}
                                            </span>
                                        )}
                                    </Tooltip>
                                </div>

                                {!isSingleRecipient && (
                                    <div className="shrink-0 text-sm">
                                        <div className={clsx('ml-auto flex flex-row flex-nowrap justify-end')}>
                                            <Price
                                                unit={exchangeRate ?? settings.BitcoinUnit}
                                                satsAmount={output.value}
                                            />
                                        </div>
                                        {exchangeRate && (
                                            <div
                                                className={clsx(
                                                    'block ml-auto color-hint flex flex-row flex-nowrap justify-end'
                                                )}
                                            >
                                                {convertAmountStr(
                                                    output.value,
                                                    COMPUTE_BITCOIN_UNIT,
                                                    settings.BitcoinUnit
                                                )}{' '}
                                                {getLabelByUnit(settings.BitcoinUnit)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Icon className="ml-2 shrink-0" name="chevron-right" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export const SendersDataItem = ({ tx, onClickEditSender }: TxDataListItemProps & { onClickEditSender: () => void }) => {
    const { walletMap } = useBitcoinBlockchainContext();
    const senderName = getTransactionSenderHumanReadableName(tx, walletMap);

    return (
        <div className="flex flex-row flex-nowrap items-center w-full">
            <div className="flex flex-column items-start grow mr-4">
                <span className="block color-weak">{c('Wallet transaction').t`From`}</span>

                <ul className="unstyled my-0 text-lg w-full">
                    <li className="flex flex-column my-1">
                        <Tooltip title={senderName}>
                            <span className="block w-full text-ellipsis">{senderName}</span>
                        </Tooltip>
                    </li>
                </ul>
            </div>

            {tx.apiData?.Type && ['NotSend', 'ExternalReceive'].includes(tx.apiData?.Type) && (
                <Tooltip title={c('Action').t`Edit`}>
                    <CoreButton
                        className="rounded-full bg-norm"
                        icon
                        shape="solid"
                        data-testid="modal:edit"
                        onClick={() => onClickEditSender()}
                    >
                        <Icon name="pen" alt={c('Action').t`Edit`} />
                    </CoreButton>
                </Tooltip>
            )}
        </div>
    );
};

export const DateDataItem = ({ tx }: TxDataListItemProps) => {
    const now = useMemo(() => new Date(), []);

    if (!tx.networkData.time.confirmation_time) {
        return null;
    }

    const confirmedDate = getFormattedPeriodSinceConfirmation(
        now,
        new Date(tx.networkData.time.confirmation_time * SECOND)
    );

    return (
        <>
            <hr className="my-4" />
            <div className="flex flex-row items-center w-full">
                <div className="flex flex-column items-start grow mr-4">
                    <span className="block color-weak">{c('Wallet transaction').t`Date`}</span>

                    <Tooltip title={confirmedDate}>
                        <span className="block w-full text-lg my-1 text-ellipsis">{confirmedDate}</span>
                    </Tooltip>
                </div>
            </div>
        </>
    );
};

export const StatusDataItem = ({ tx }: TxDataListItemProps) => {
    const isConfirmed = !!tx.networkData.time.confirmation_time;

    return (
        <div className="flex flex-row items-center w-full">
            <div className="flex flex-column items-start grow mr-4">
                <span className="block color-weak">{c('Wallet transaction').t`Status`}</span>

                <span
                    className={clsx(
                        'block w-full text-lg my-1 text-ellipsis',
                        isConfirmed ? 'color-success' : 'color-primary'
                    )}
                >
                    {isConfirmed ? c('Wallet transaction').t`Confirmed` : c('Wallet transaction').t`In progress`}
                </span>
            </div>
        </div>
    );
};

export const NoteDataItem = ({ tx, onClick }: TxDataListItemProps & { onClick: (tx: TransactionData) => void }) => {
    return (
        <div className="w-full max-h-custom overflow-auto">
            <div className="flex flex-row items-center">
                <span className="block color-weak">{c('Wallet transaction').t`Private note to myself`}</span>
            </div>
            <div className="w-full flex flex-row flex-nowrap items-center">
                {tx.apiData?.Label ? (
                    <>
                        <span className="text-pre-wrap text-break text-left text-lg grow mr-4 my-1">
                            {tx.apiData.Label}
                        </span>
                        <Tooltip title={c('Action').t`Edit`}>
                            <CoreButton
                                className="rounded-full bg-norm shrink-0"
                                icon
                                shape="solid"
                                data-testid="modal:edit"
                                onClick={() => onClick(tx)}
                            >
                                <Icon name="pen" alt={c('Action').t`Edit`} />
                            </CoreButton>
                        </Tooltip>
                    </>
                ) : (
                    <CoreButton
                        shape="ghost"
                        style={{
                            color: 'var(--interaction-norm)',
                            background: 'transparent',
                        }}
                        className="px-0 flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(tx);
                        }}
                    >
                        <Icon name="plus-circle" className="mr-1" />
                        {c('Wallet transaction').t`Add note`}
                    </CoreButton>
                )}
            </div>
        </div>
    );
};

export const MessageDataItem = ({ tx }: TxDataListItemProps) => {
    return (
        <div className="flex flex-row items-center w-full">
            <div className="flex flex-column items-start grow mr-4">
                <span className="block color-weak">{c('Wallet transaction').t`Message to recipient`}</span>
                <span className="block w-full text-pre-wrap text-left text-break my-1 text-lg">{tx.apiData?.Body}</span>
            </div>
        </div>
    );
};

export const AmountDataItem = ({
    exchangeRate,
    amount,
    label = c('Wallet transaction').t`Amount`,
    infoTitle,
}: {
    amount?: number | null;
    label?: string;
    exchangeRate?: WasmApiExchangeRate;
    infoTitle?: string;
}) => {
    const [settings] = useUserWalletSettings();

    return (
        <div className="w-full">
            <span className="color-weak flex items-center gap-2 my-1">
                {label}
                {infoTitle && <Info title={infoTitle} className="color-hint" />}
            </span>
            <div className="flex flex-row flex-nowrap items-center text-lg my-1">
                <Price unit={exchangeRate ?? settings.BitcoinUnit} satsAmount={amount ?? 0} />
            </div>
            {exchangeRate && (
                <div className="color-weak">
                    {convertAmountStr(amount ?? 0, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                    {getLabelByUnit(settings.BitcoinUnit)}
                </div>
            )}
        </div>
    );
};

export const LinkToBlockchainDataItem = ({ tx, network }: TxDataListItemProps & { network?: WasmNetwork }) => {
    const url = !isUndefined(network) && BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK[network];
    if (!url) {
        return null;
    }

    return (
        <>
            <hr className="my-4" />
            <div className="flex w-full justify-center">
                <span className="block color-hint text-rg"></span>
                <ButtonLike
                    as={Href}
                    href={`${url}/${tx.networkData.txid}`}
                    target="_blank"
                    fullWidth
                    shape="solid"
                    color="norm"
                    className="wallet-button"
                >
                    {c('Link').t`View on blockchain`}
                </ButtonLike>
            </div>
        </>
    );
};
