import { format } from 'date-fns';
import { isSameWeek, isToday } from 'date-fns';
import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmTransactionDetails, WasmTransactionTime, WasmTxOut } from '@proton/andromeda';
import { SECOND } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Address } from '@proton/shared/lib/interfaces';
import { WalletMap } from '@proton/wallet';

import { TransactionData } from '../hooks/useWalletTransactions';
import { isSelfAddress } from './email';
import { multilineStrToOnelineJsx } from './string';

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const transactionTime = (transaction: WasmTransactionDetails) => {
    if (transaction.time?.confirmation_time) {
        return toMsTimestamp(transaction.time?.confirmation_time);
    }

    if (transaction.time?.last_seen) {
        return toMsTimestamp(transaction.time?.last_seen);
    }

    return new Date().getTime();
};

export const sortTransactionsByTime = (transactions: WasmTransactionDetails[]) => {
    return [...transactions].sort((txA, txB) => transactionTime(txB) - transactionTime(txA));
};

export const confirmationTimeToHumanReadable = (confirmation?: WasmTransactionTime | null): string => {
    if (confirmation?.confirmation_time) {
        return format(new Date(Number(confirmation.confirmation_time) * 1000), 'dd MMM yyyy, hh:mm');
    }

    if (confirmation?.last_seen) {
        return format(new Date(Number(confirmation.last_seen) * 1000), 'dd MMM yyyy, hh:mm');
    }

    return '-';
};

export const getFormattedPeriodSinceConfirmation = (now: Date, confirmation: Date) => {
    const options = { locale: dateLocale };
    if (!confirmation) {
        return;
    }

    if (isToday(confirmation)) {
        return format(confirmation, 'p', options);
    }

    if (isSameWeek(confirmation, now, options)) {
        return format(confirmation, 'EEEE, p', options);
    }

    return format(confirmation, 'MMM d, y, p', options);
};

export const getTransactionSenderHumanReadableName = (transaction: TransactionData, walletMap: WalletMap) => {
    const isSentTx = transaction.networkData.sent > transaction.networkData.received;

    // If transaction was sent using the current wallet account, we display the Wallet - WalletAccount as sender
    if (isSentTx && transaction.apiData?.WalletID && transaction.apiData?.WalletAccountID) {
        const wallet = walletMap[transaction.apiData.WalletID];
        const account = wallet?.accounts[transaction.apiData.WalletAccountID];

        if (wallet && account) {
            return `${wallet.wallet.Wallet.Name} - ${account.Label}`;
        }
    }

    // If there is a sender attached to the transaction, we display it
    if (transaction.apiData?.Sender) {
        if (typeof transaction.apiData?.Sender === 'string') {
            return transaction.apiData?.Sender;
        } else {
            return `${transaction.apiData?.Sender.name} - ${transaction.apiData?.Sender.email}`;
        }
    }

    // Fallback
    return c('Wallet transaction').t`Unknown`;
};

export const getTransactionRecipientHumanReadableName = (
    transaction: TransactionData,
    output: WasmTxOut,
    walletMap: WalletMap,
    addresses: Address[] = []
) => {
    const address = transaction.apiData?.ToList[output.address];
    const isSentTx = transaction.networkData.sent > transaction.networkData.received;

    // If output is owned by wallet account and transaction wasn't sent from it, we display the Wallet - WalletAccount as recipient
    if (!isSentTx && output.is_mine && transaction.apiData?.WalletID && transaction.apiData?.WalletAccountID) {
        const wallet = walletMap[transaction.apiData.WalletID];
        const account = wallet?.accounts[transaction.apiData.WalletAccountID];

        if (wallet && account) {
            return `${wallet.wallet.Wallet.Name} - ${account.Label}`;
        }
    }

    if (address) {
        return isSelfAddress(address, addresses ?? []) ? c('Wallet transaction').t`${address} (me)` : address;
    }

    return null;
};

export const getTransactionRecipientsHumanReadableName = (
    transaction: TransactionData,
    walletMap: WalletMap,
    addresses: Address[] = []
) => {
    const humanReadableOutputs = compact(
        transaction.networkData.outputs.map((o) =>
            getTransactionRecipientHumanReadableName(transaction, o, walletMap, addresses)
        )
    );

    return humanReadableOutputs;
};

export const getTransactionMessage = (transaction: TransactionData) => {
    // If transaction was sent using the current wallet account, we display the Wallet - WalletAccount as sender
    if (transaction.apiData?.Body) {
        return multilineStrToOnelineJsx(transaction.apiData?.Body ?? '', 'transaction-message');
    }

    return null;
};
