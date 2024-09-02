import { format, isSameWeek, isToday } from 'date-fns';
import compact from 'lodash/compact';
import { c } from 'ttag';

import type { WasmTransactionDetails, WasmTxOut } from '@proton/andromeda';
import { SECOND } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address } from '@proton/shared/lib/interfaces';
import type { WalletMap } from '@proton/wallet';

import type { TransactionData } from '../hooks/useWalletTransactions';
import { isSelfAddress } from './email';
import { formatReadableNameAndEmail, multilineStrToOnelineJsx } from './string';

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const isSentTransaction = (transaction: TransactionData) => {
    return transaction.networkData.sent > transaction.networkData.received;
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

const getWalletAndAccountFromTransaction = (transaction: TransactionData, walletMap: WalletMap) => {
    const { apiData } = transaction;

    if (!apiData) {
        return { wallet: undefined, account: undefined };
    }

    const wallet = walletMap[apiData.WalletID];
    const account = apiData.WalletAccountID ? wallet?.accounts[apiData.WalletAccountID] : undefined;

    return { wallet, account };
};

export const getTransactionSenderHumanReadableName = (transaction: TransactionData, walletMap: WalletMap) => {
    const { wallet, account } = getWalletAndAccountFromTransaction(transaction, walletMap);

    // If transaction was sent using the current wallet account, we display the Wallet - WalletAccount as sender
    if (isSentTransaction(transaction) && wallet && account) {
        return `${wallet.wallet.Wallet.Name} - ${account.Label}`;
    }
    // If there is a sender attached to the transaction, we display it
    const sender = transaction.apiData?.Sender;
    if (sender) {
        if (typeof sender === 'string') {
            return sender;
        } else {
            if (sender.name && sender.email) {
                return formatReadableNameAndEmail(sender.name, sender.email);
            }
            return sender.email || sender.name;
        }
    }

    if (transaction.apiData?.Type && transaction.apiData.Type === 'ProtonToProtonReceive') {
        return c('Wallet transaction').t`Anonymous sender`;
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
    const address = transaction.apiData?.ToList?.[output.address];
    const { wallet, account } = getWalletAndAccountFromTransaction(transaction, walletMap);

    // If output is owned by wallet account and transaction wasn't sent from it, we display the Wallet - WalletAccount as recipient
    if (!isSentTransaction(transaction) && output.is_mine && wallet && account) {
        const otherReceivingAccount = wallet?.wallet?.WalletAccounts?.find(
            (account) => account.DerivationPath === transaction.networkData.account_derivation_path
        );

        if (otherReceivingAccount) {
            return `${wallet.wallet.Wallet.Name} - ${otherReceivingAccount.Label}`;
        }
        return `${wallet.wallet.Wallet.Name} - ${account.Label}`;
    }

    if (address) {
        return isSelfAddress(address, addresses ?? []) ? c('Wallet transaction').t`${address} (me)` : address;
    }

    return output.address;
};

export const getTransactionRecipientsHumanReadableName = (
    transaction: TransactionData,
    walletMap: WalletMap,
    addresses: Address[] = []
) => {
    const humanReadableOutputs = compact(
        transaction.networkData.outputs
            .filter((o) => !o.is_mine)
            .map((o) => getTransactionRecipientHumanReadableName(transaction, o, walletMap, addresses))
    );

    if (humanReadableOutputs.length === 0 && isSentTransaction(transaction)) {
        // If we sent to ourselves, just display all addresses without filtering
        return compact(
            transaction.networkData.outputs.map((o) =>
                getTransactionRecipientHumanReadableName(transaction, o, walletMap, addresses)
            )
        );
    }

    return humanReadableOutputs;
};

export const getTransactionMessage = (transaction: TransactionData) => {
    // If transaction was sent using the current wallet account, we display the Wallet - WalletAccount as sender
    if (transaction.apiData?.Body) {
        return multilineStrToOnelineJsx(transaction.apiData?.Body ?? '', 'transaction-message');
    }

    return null;
};
