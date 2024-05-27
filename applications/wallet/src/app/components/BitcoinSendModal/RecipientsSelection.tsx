import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmTxBuilder } from '@proton/andromeda';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { useApi } from '@proton/components/hooks';
import { CryptoProxy, PublicKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import { useWalletApiClients, verifySignedData } from '@proton/wallet';

import { Button } from '../../atoms';
import { MAX_RECIPIENTS_PER_TRANSACTIONS } from '../../constants/email-integration';
import { TxBuilderUpdater } from '../../hooks/useTxBuilder';
import { useBitcoinNetwork } from '../../store/hooks';
import { isUndefined, isValidBitcoinAddress } from '../../utils';
import { EmailOrBitcoinAddressInput } from '../EmailOrBitcoinAddressInput';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';

interface Props {
    recipientHelpers: ReturnType<typeof useEmailAndBtcAddressesMaps>;
    onRecipientsConfirm: () => void;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
}

export const RecipientsSelection = ({ recipientHelpers, txBuilder, onRecipientsConfirm, updateTxBuilder }: Props) => {
    const { recipientEmailMap, addValidRecipient, addInvalidRecipient, removeRecipient, exists } = recipientHelpers;

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { contactEmails, contactEmailsMap } = useContactEmailsCache();
    const [loadingBitcoinAddressLookup, withLoadingBitcoinAddressLookup] = useLoading();
    const [network] = useBitcoinNetwork();
    const walletApi = useWalletApiClients();
    const api = useApi();

    const safeAddRecipient = (
        recipientOrBitcoinAddress: Recipient,
        btcAddress: string,
        addressKey?: PublicKeyReference
    ) => {
        if (!exists(recipientOrBitcoinAddress)) {
            addValidRecipient(recipientOrBitcoinAddress, btcAddress, addressKey);
            updateTxBuilder((txBuilder) => txBuilder.addRecipient(btcAddress));
        }
    };

    const handleAddRecipients = async (recipientOrBitcoinAddresses: Recipient[]) => {
        if (isUndefined(network)) {
            return;
        }

        const remainingSlot = Math.max(MAX_RECIPIENTS_PER_TRANSACTIONS - Object.values(recipientEmailMap).length, 0);

        for (const recipientOrBitcoinAddress of recipientOrBitcoinAddresses.slice(0, remainingSlot)) {
            if (validateEmailAddress(recipientOrBitcoinAddress?.Address)) {
                try {
                    const bitcoinAddress = await walletApi.email_integration.lookupBitcoinAddress(
                        recipientOrBitcoinAddress.Address
                    );

                    const btcAddress = bitcoinAddress.Data.BitcoinAddress;
                    const btcAddressSignature = bitcoinAddress.Data.BitcoinAddressSignature;

                    if (!btcAddress) {
                        addInvalidRecipient(
                            recipientOrBitcoinAddress,
                            c('Wallet send').t`No address set on this BitcoinAddress`
                        );
                        continue;
                    }

                    if (!btcAddressSignature) {
                        addInvalidRecipient(
                            recipientOrBitcoinAddress,
                            c('Wallet send').t`No address set on this BitcoinAddress`
                        );
                        continue;
                    }

                    // Bitcoin address signature verification
                    const { addressKeys } = await getAndVerifyApiKeys({
                        api,
                        email: recipientOrBitcoinAddress.Address,
                        internalKeysOnly: true,
                        verifyOutboundPublicKeys,
                    });

                    // TODO: maybe find a better way to find publickey that signed address
                    const publicKeys = await Promise.all(
                        addressKeys.map(async (addressKey) => {
                            const pubkey = await CryptoProxy.importPublicKey({ armoredKey: addressKey.armoredKey });
                            const isVerified = await verifySignedData(
                                btcAddress,
                                btcAddressSignature,
                                'wallet.bitcoin-address',
                                [pubkey]
                            );

                            return isVerified ? pubkey : null;
                        })
                    );

                    const [firstAddressKey] = compact(publicKeys);
                    if (!firstAddressKey) {
                        addInvalidRecipient(
                            recipientOrBitcoinAddress,
                            c('Wallet send').t`Bitcoin address signature could not be verified`
                        );
                    } else {
                        safeAddRecipient(recipientOrBitcoinAddress, btcAddress, firstAddressKey);
                    }
                } catch {
                    addInvalidRecipient(
                        recipientOrBitcoinAddress,
                        c('Wallet send').t`Could not find address linked to this email`
                    );
                }
            } else if (isValidBitcoinAddress(recipientOrBitcoinAddress.Address, network)) {
                safeAddRecipient(recipientOrBitcoinAddress, recipientOrBitcoinAddress.Address);
            } else {
                addInvalidRecipient(recipientOrBitcoinAddress, c('Wallet send').t`Added address is invalid`);
            }
        }
    };

    const handleRemoveRecipient = (recipient: Recipient) => {
        const recipientToRemove = recipientEmailMap[recipient.Address];
        const indexToRemove = txBuilder.getRecipients().findIndex((r) => r[1] === recipientToRemove?.btcAddress.value);

        updateTxBuilder((txBuilder) => txBuilder.removeRecipient(indexToRemove));
        removeRecipient(recipient);
    };

    if (isUndefined(network)) {
        return null;
    }

    return (
        <div className="flex flex-column max-w-full justify-center">
            <EmailOrBitcoinAddressInput
                disabled={Object.values(loadingBitcoinAddressLookup).some((v) => Boolean(v))}
                placeholder={'andy.yen@proton.ch / bc1...'}
                contactEmails={contactEmails}
                contactEmailsMap={contactEmailsMap}
                recipientEmailMap={recipientEmailMap}
                network={network}
                loading={loadingBitcoinAddressLookup}
                onAddRecipients={(recipients: Recipient[]) => {
                    void withLoadingBitcoinAddressLookup(handleAddRecipients(recipients));
                }}
                onRemoveRecipient={(recipient: Recipient) => handleRemoveRecipient(recipient)}
            />

            {txBuilder.getRecipients().length ? (
                <Button
                    color="norm"
                    shape="solid"
                    className="mt-6"
                    fullWidth
                    onClick={() => {
                        onRecipientsConfirm();
                    }}
                >{c('Wallet send').t`Confirm`}</Button>
            ) : null}
        </div>
    );
};
