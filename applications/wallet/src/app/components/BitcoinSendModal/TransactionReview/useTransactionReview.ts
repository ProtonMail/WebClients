import { useCallback, useEffect, useMemo, useState } from 'react';

import compact from 'lodash/compact';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { useAddressesKeys, useGetAddressKeys, useNotifications } from '@proton/components/hooks';
import type { DecryptedAddressKey, SimpleMap } from '@proton/shared/lib/interfaces';
import type { IWasmApiWalletData } from '@proton/wallet';

import { ANONYMOUS_SENDER_ADDRESS_ID } from '../../../constants/wallet';
import { usePsbt } from '../../../hooks/usePsbt';
import type { TxBuilderHelper } from '../../../hooks/useTxBuilder';
import type { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';

export const getAnonymousSenderAddress = () => ({
    Email: c('Wallet send').t`Anonymous sender`,
    ID: ANONYMOUS_SENDER_ADDRESS_ID,
});

export const useTransactionReview = ({
    isUsingBitcoinViaEmail,
    wallet,
    account,
    exchangeRate,
    txBuilderHelpers,
    btcAddressMap,
    onSent,
}: {
    isUsingBitcoinViaEmail: boolean;
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
    exchangeRate: WasmApiExchangeRate;
    txBuilderHelpers: TxBuilderHelper;
    btcAddressMap: BtcAddressMap;
    onSent: () => void;
}) => {
    const { txBuilder } = txBuilderHelpers;

    const [addresses] = useAddressesKeys();

    // Address that will be used as a fallback when anonymous sender is selected
    const primaryAddress = useMemo(() => {
        const primaryAddressId = addresses?.at(0)?.address.ID;
        const primaryAddressKey = addresses?.at(0)?.keys.at(0);

        if (primaryAddressId && primaryAddressKey) {
            return {
                ID: primaryAddressId,
                key: primaryAddressKey,
            };
        }
    }, [addresses]);

    const txBuilderRecipients = txBuilder.getRecipients();
    const { createNotification } = useNotifications();

    const [senderAddress, setSenderAddress] = useState<{ ID: string; key?: DecryptedAddressKey }>();

    const getAddressKeys = useGetAddressKeys();

    const [message, setMessage] = useState('');
    const [noteToSelf, setNoteToSelf] = useState('');

    const { psbt, signAndBroadcastPsbt } = usePsbt({ txBuilderHelpers }, true);

    const psbtExpectedSize = psbt?.computeTxSize();

    const totalFees = Number(psbt?.total_fees ?? 0);
    const totalSentAmount = txBuilderRecipients.reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const totalAmount = totalFees + totalSentAmount;

    const [recipientsAddresses, emailAddressByBtcAddress] = useMemo(() => {
        const recipientsAddresses = compact(txBuilderRecipients.map((r) => btcAddressMap[r[1]]));
        const emailAddressByBtcAddress: SimpleMap<string> = txBuilderRecipients.reduce((acc, recipient) => {
            const btcAddress = recipient[1];
            const emailAddress = btcAddressMap[btcAddress]?.recipient.Address;

            return emailAddress ? { ...acc, [btcAddress]: emailAddress } : acc;
        }, {});

        return [recipientsAddresses, emailAddressByBtcAddress];
    }, [btcAddressMap, txBuilderRecipients]);

    const onSelectAddress = useCallback(
        async (senderAddressId?: string) => {
            const isAnonymousSend = senderAddress?.ID === ANONYMOUS_SENDER_ADDRESS_ID;

            if (senderAddressId) {
                const addressKeys = isAnonymousSend ? [] : await getAddressKeys(senderAddressId);
                setSenderAddress({ ID: senderAddressId, key: addressKeys.at(0) });
            } else {
                setSenderAddress(undefined);
            }
        },
        [getAddressKeys, senderAddress?.ID]
    );

    useEffect(() => {
        const run = async () => {
            // We use primaryAddress when user wants to use BvE but doesn't have any email set on the wallet account he is using
            const defaultAddress = account.Addresses.at(0) ?? addresses?.at(0)?.address;

            const defaultSenderAddressId: string | undefined = defaultAddress?.ID;

            if (defaultSenderAddressId && !senderAddress) {
                await onSelectAddress(defaultSenderAddressId);
            }
        };

        void run();
    }, [account.Addresses, addresses, onSelectAddress, senderAddress]);

    const isAnonymousSend = senderAddress?.ID === ANONYMOUS_SENDER_ADDRESS_ID;

    // When user picked anonymous sender, we want to use the fallback address instead of selected one
    const finalSenderAddress = useMemo(() => {
        const { ID, key } = senderAddress ?? {};
        if (ID && key) {
            return {
                ID,
                key,
            };
        }

        return primaryAddress;
    }, [primaryAddress, senderAddress]);

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
                ...(finalSenderAddress && isUsingBitcoinViaEmail
                    ? {
                          isAnonymousSend,
                          senderAddress: finalSenderAddress,
                          recipients: emailAddressByBtcAddress,
                          message: {
                              content: message,
                              encryptionKeys: compact(recipientsAddresses.map((r) => r.addressKey)),
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
        onSelectAddress,

        totalSentAmount,
        totalFees,
        totalAmount,
        psbtExpectedSize,

        handleSendTransaction,
    };
};
