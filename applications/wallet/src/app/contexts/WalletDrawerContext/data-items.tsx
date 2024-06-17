import { isUndefined } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmNetwork } from '@proton/andromeda';
import { Href } from '@proton/atoms/Href';
import { Icon, Tooltip } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { ButtonLike, CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import { TxDataListItemProps } from '../../components/TransactionList/data-list-items';
import { BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK } from '../../constants';
import { TransactionData } from '../../hooks/useWalletTransactions';
import {
    getTransactionRecipientHumanReadableName,
    getTransactionSenderHumanReadableName,
    satsToBitcoin,
} from '../../utils';
import { multilineStrToMultilineJsx } from '../../utils/string';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';

export const RecipientsDataListItem = ({ tx }: TxDataListItemProps) => {
    const isSentTx = tx.networkData.sent > tx.networkData.received;
    const [addresses] = useAddresses();
    const { walletMap } = useBitcoinBlockchainContext();

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`To`}</span>
            <ul className="unstyled mt-1 text-lg">
                {tx.networkData.outputs
                    .filter((o) => !isSentTx || !o.is_mine)
                    .map((output, index) => {
                        const recipient = getTransactionRecipientHumanReadableName(tx, output, walletMap, addresses);

                        return (
                            <li key={index} className="flex flex-column my-1">
                                {recipient && (
                                    <Tooltip title={recipient}>
                                        <span className="block w-full text-ellipsis">{recipient}</span>
                                    </Tooltip>
                                )}

                                <Tooltip title={output.address}>
                                    <span className="block w-full text-ellipsis color-weak">{output.address}</span>
                                </Tooltip>
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
};

export const SendersDataListItem = ({ tx }: TxDataListItemProps) => {
    const { walletMap } = useBitcoinBlockchainContext();
    const senderName = getTransactionSenderHumanReadableName(tx, walletMap);

    return (
        <div className="w-full">
            <span className="block color-hint text-rg">{c('Wallet transaction').t`From`}</span>
            <ul className="unstyled mt-1 text-lg">
                <li className="flex flex-column my-1">
                    <Tooltip title={senderName}>
                        <span className="block w-full text-ellipsis">{senderName}</span>
                    </Tooltip>
                </li>
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
                    <p className="my-0 mt-1 text-lg text-ellipsis">
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
            <p className="my-0 mt-1 text-lg">{tx.apiData?.Body}</p>
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
                    <Price unit={exchangeRate ?? 'BTC'} satsAmount={amount ?? 0} />
                </div>
            </div>
            {exchangeRate && <div className="color-weak">{satsToBitcoin(amount ?? 0)} BTC</div>}
        </div>
    );
};

export const LinkToBlockchainItem = ({ tx, network }: TxDataListItemProps & { network?: WasmNetwork }) => {
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
