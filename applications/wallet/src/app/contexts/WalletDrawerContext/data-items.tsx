import { useMemo } from 'react';

import { isUndefined } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmNetwork } from '@proton/andromeda';
import { Href } from '@proton/atoms/Href';
import { Icon, Tooltip } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ButtonLike, CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import { TxDataListItemProps } from '../../components/TransactionList/data-list-items';
import { BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK } from '../../constants';
import { COMPUTE_BITCOIN_UNIT } from '../../constants';
import { TransactionData } from '../../hooks/useWalletTransactions';
import { useUserWalletSettings } from '../../store/hooks/useUserWalletSettings';
import {
    convertAmount,
    getFormattedPeriodSinceConfirmation,
    getLabelByUnit,
    getTransactionRecipientHumanReadableName,
    getTransactionSenderHumanReadableName,
} from '../../utils';
import { multilineStrToMultilineJsx } from '../../utils/string';
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

    return (
        <div className="w-full">
            <ul className="unstyled my-1 text-lg flex gap-3">
                {tx.networkData.outputs
                    .filter((o) => !isSentTx || !o.is_mine)
                    .map((output, index) => {
                        const recipient = getTransactionRecipientHumanReadableName(tx, output, walletMap, addresses);

                        return (
                            <li key={index} className="flex flex-row items-center my-1">
                                <button
                                    className="flex flex-row flex-nowrap items-center w-full"
                                    onClick={() => onClick(recipient, output.address, index)}
                                >
                                    <div className="flex flex-column items-start grow mr-2">
                                        <span className="block color-weak">{c('Wallet transaction').t`To`}</span>

                                        <Tooltip title={recipient}>
                                            <span className="block w-full text-ellipsis">{recipient}</span>
                                        </Tooltip>
                                    </div>

                                    <div className="no-shrink text-sm">
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
                                                {convertAmount(
                                                    output.value,
                                                    COMPUTE_BITCOIN_UNIT,
                                                    settings.BitcoinUnit
                                                )}{' '}
                                                {getLabelByUnit(settings.BitcoinUnit)}
                                            </div>
                                        )}
                                    </div>

                                    <Icon className="ml-2 no-shrink" name="chevron-right" />
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
                <span className="block color-hint text-rg">{c('Wallet transaction').t`From`}</span>

                <ul className="unstyled my-1 text-lg w-full">
                    <li className="flex flex-column my-1">
                        <Tooltip title={senderName}>
                            <span className="block w-full text-ellipsis">{senderName}</span>
                        </Tooltip>
                    </li>
                </ul>
            </div>

            {tx.apiData?.Type && ['NotSend', 'ExternalSend', 'ExternalReceive'].includes(tx.apiData?.Type) && (
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
                    <span className="block color-hint text-rg">{c('Wallet transaction').t`Date`}</span>

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
                <span className="block color-hint text-rg">{c('Wallet transaction').t`Status`}</span>

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
                <span className="block color-hint text-rg">{c('Wallet transaction').t`Private note to myself`}</span>
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
                    <p className="my-0 mt-1 text-lg">
                        {multilineStrToMultilineJsx(tx.apiData.Label, 'transaction-label')}
                    </p>
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
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`Message`}</span>
            <p className="my-0 mt-1 text-lg">
                {multilineStrToMultilineJsx(tx.apiData?.Body ?? '', 'transaction-message')}
            </p>
        </div>
    );
};

export const AmountDataItem = ({
    exchangeRate,
    amount,
    label = c('Wallet transaction').t`Amount`,
}: {
    amount?: number | null;
    label?: string;
    exchangeRate?: WasmApiExchangeRate;
}) => {
    const [settings] = useUserWalletSettings();

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{label}</span>
            <div className="flex flex-row flex-nowrap items-center mt-1 text-lg">
                <div className={clsx('text-semibold')}>
                    <Price unit={exchangeRate ?? settings.BitcoinUnit} satsAmount={amount ?? 0} />
                </div>
            </div>
            {exchangeRate && (
                <div className="color-weak">
                    {convertAmount(amount ?? 0, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
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
                <p className="my-0 mt-1 text-lg">
                    <ButtonLike
                        as={Href}
                        href={`${url}/${tx.networkData.txid}`}
                        target="_blank"
                        fullWidth
                        shape="solid"
                        color="norm"
                        style={{ 'padding-left': '4rem', 'padding-right': '4rem' }}
                    >
                        {c('Link').t`View on blockchain`}
                    </ButtonLike>
                </p>
            </div>
        </>
    );
};
