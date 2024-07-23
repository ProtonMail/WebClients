import { useEffect, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount, WasmTxBuilder } from '@proton/andromeda';
import { useAddresses, useGetAddressKeys, useNotifications } from '@proton/components/hooks';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import type { IWasmApiWalletData } from '@proton/wallet';

import { usePsbt } from '../../../hooks/usePsbt';
import type { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';

export const useTransactionReview = ({
    isUsingBitcoinViaEmail,
    wallet,
    account,
    exchangeRate,
    txBuilder,
    btcAddressMap,
    onSent,
}: {
    isUsingBitcoinViaEmail: boolean;
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
    exchangeRate: WasmApiExchangeRate;
    txBuilder: WasmTxBuilder;
    btcAddressMap: BtcAddressMap;
    onSent: () => void;
}) => {
    const [addresses] = useAddresses();
    // We use primaryAddress when user wants to use BvE but doesn't have any email set on the wallet account he is using
    const primaryAddress = addresses?.[0];

    const txBuilderRecipients = txBuilder.getRecipients();
    const { createNotification } = useNotifications();

    const [senderAddress, setSenderAddress] = useState<{ ID: string; key: DecryptedAddressKey }>();

    const getAddressKeys = useGetAddressKeys();

    const [message, setMessage] = useState('');
    const [noteToSelf, setNoteToSelf] = useState('');

    const { psbt, signAndBroadcastPsbt } = usePsbt({ txBuilder }, true);

    const psbtExpectedSize = psbt?.computeTxSize();

    const totalFees = Number(psbt?.total_fees ?? 0);
    const totalSentAmount = txBuilderRecipients.reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const totalAmount = totalFees + totalSentAmount;

    // Typeguard, no recipient should be undefined here
    const recipients = compact(txBuilder.getRecipients().map((r) => btcAddressMap[r[1]]));

    useEffect(() => {
        const run = async () => {
            const senderAddressId: string | undefined = account.Addresses[0]?.ID ?? primaryAddress?.ID;

            if (senderAddressId) {
                const [senderAddressKey] = await getAddressKeys(senderAddressId);
                setSenderAddress({ ID: senderAddressId, key: senderAddressKey });
            }
        };

        void run();
    }, [account.Addresses, getAddressKeys, primaryAddress?.ID]);

    const handleSendTransaction = async () => {
        try {
            await signAndBroadcastPsbt({
                apiAccount: account,
                apiWalletData: wallet,
                exchangeRateId: 'isBitcoinRate' in exchangeRate ? undefined : exchangeRate?.ID,
                noteToSelf: noteToSelf || undefined,
                /**
                 * We don't want to send message field to the API if:
                 * - User has no address key at all
                 * - User is not using bitcoin via email
                 */
                ...(senderAddress && isUsingBitcoinViaEmail
                    ? {
                          senderAddress,
                          message: {
                              content: message,
                              encryptionKeys: compact(recipients.map((r) => r.addressKey)),
                          },
                      }
                    : {}),
            });

            onSent();

            createNotification({
                text: c('Wallet send').t`Transaction was successfully sent`,
            });
        } catch (error) {
            createNotification({
                type: 'error',
                text:
                    typeof error === 'object' && error && 'message' in error
                        ? (error.message as string)
                        : c('Wallet send').t`The transaction could not be sent. Please try again later`,
            });
        }
    };

    return {
        message,
        setMessage,

        noteToSelf,
        setNoteToSelf,

        senderAddress,

        totalSentAmount,
        totalFees,
        totalAmount,
        psbtExpectedSize,

        handleSendTransaction,
    };
};
