import { format, isSameWeek, isToday } from 'date-fns';
import compact from 'lodash/compact';
import { c } from 'ttag';

import type {
    WasmApiWalletAccount,
    WasmBlockchainClient,
    WasmEmailIntegrationData,
    WasmNetwork,
    WasmPsbt,
    WasmTransactionDetails,
    WasmTxOut,
} from '@proton/andromeda';
import { type PublicKeyReference } from '@proton/crypto/lib';
import { SECOND } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address, DecryptedAddressKey, DecryptedKey, SimpleMap } from '@proton/shared/lib/interfaces';
import {
    type IWasmApiWalletData,
    type TransactionData,
    type WalletChainDataByWalletId,
    encryptPgp,
    encryptTransactionMessage,
    encryptWalletDataWithWalletKey,
} from '@proton/wallet';

import { type WalletMap } from '../types';
import { getAccountWithChainDataFromManyWallets } from './accounts';
import { isSelfAddress } from './email';
import { formatReadableNameAndEmail, multilineStrToOnelineJsx } from './string';

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const getNowTimestamp = (): string => {
    return Math.floor(Date.now() / SECOND).toString();
};

export const getTransactionValue = (tx?: TransactionData, includeFeeOnSent: boolean = true) => {
    const value = (tx?.networkData.received ?? 0) - (tx?.networkData.sent ?? 0);
    return !includeFeeOnSent && value < 0 ? value + (tx?.networkData.fee ?? 0) : value;
};

export const isSentTransaction = (transaction?: TransactionData) => {
    return getTransactionValue(transaction) < 0;
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
    const address = output.address ? transaction.apiData?.ToList?.[output.address] : undefined;
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

    return output.address ?? c('Wallet transaction').t`Unknown`;
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

export interface BroadcastData
    extends Required<
        Pick<{ apiWalletData?: IWasmApiWalletData; apiAccount?: WasmApiWalletAccount }, 'apiAccount' | 'apiWalletData'>
    > {
    psbt: WasmPsbt;
    blockchainClient: WasmBlockchainClient;
    network: WasmNetwork;
    walletsChainData: WalletChainDataByWalletId;
    userKeys: DecryptedKey[];
    noteToSelf?: string;
    exchangeRateId?: string;
    // BvE data
    message?: {
        content: string;
        recipients: { email: string; key: PublicKeyReference }[];
    };
    senderAddress?: {
        ID: string;
        email: string;
        key: DecryptedAddressKey;
    };
    recipients?: SimpleMap<string>;
    isAnonymousSend?: boolean;
    onBroadcastedTx: (txid: string) => void;
    isPaperWallet?: boolean;
}

export const signAndBroadcastPsbt = async ({
    psbt,
    blockchainClient,
    network,
    userKeys,
    walletsChainData,
    apiWalletData,
    apiAccount,
    exchangeRateId,
    noteToSelf,
    senderAddress,
    message,
    recipients,
    isAnonymousSend,
    onBroadcastedTx,
    isPaperWallet,
}: BroadcastData) => {
    const wasmAccount = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        apiWalletData?.Wallet.ID,
        apiAccount?.ID
    );

    if (!userKeys || !wasmAccount || !apiWalletData.WalletKey?.DecryptedKey) {
        return;
    }

    const signed = await psbt.sign(wasmAccount.account, network).catch(() => {
        throw new Error(c('Wallet Send').t`Could not sign transaction`);
    });

    const [encryptedNoteToSelf] = noteToSelf
        ? await encryptWalletDataWithWalletKey([noteToSelf], apiWalletData.WalletKey.DecryptedKey).catch(() => [null])
        : [null];

    const getEncryptedMessageData = async (senderAddress: {
        email: string;
        key: DecryptedAddressKey;
    }): Promise<Pick<WasmEmailIntegrationData, 'body' | 'message'>> => {
        // We don't wanna sign the message if the send is anonymous
        const signingKeys = isAnonymousSend ? [] : [senderAddress.key.privateKey];

        return message?.content
            ? {
                  body: await encryptPgp(
                      message.content,
                      [senderAddress.key.publicKey, ...compact(message.recipients.map((m) => m.key))],
                      signingKeys
                  ).catch(() => null),
                  message: await encryptTransactionMessage(
                      message.content,
                      [{ email: senderAddress.email, key: senderAddress.key.publicKey }, ...message.recipients],
                      signingKeys
                  ).catch(() => null),
              }
            : { body: null, message: null };
    };

    const transactionData = {
        label: encryptedNoteToSelf,
        exchange_rate_or_transaction_time: exchangeRateId
            ? {
                  key: 'ExchangeRate' as const,
                  value: exchangeRateId,
              }
            : { key: 'TransactionTime' as const, value: getNowTimestamp() },
        is_paper_wallet: isPaperWallet ? 1 : 0,
    };

    const bveData = senderAddress
        ? {
              recipients: (recipients as Record<string, string>) || null,
              is_anonymous: isAnonymousSend ? 1 : 0,
              address_id: senderAddress.ID,
              ...(await getEncryptedMessageData(senderAddress)),
          }
        : undefined;

    try {
        const txId = await blockchainClient.broadcastPsbt(
            signed,
            apiWalletData.Wallet.ID,
            apiAccount.ID,
            transactionData,
            bveData
        );

        onBroadcastedTx(txId);
    } catch (error: any) {
        throw new Error(
            error?.error ?? c('Wallet Send').t`Could not broadcast transaction. Please sync your wallet and try again`
        );
    }
};
