import { useCallback } from 'react';

import { c } from 'ttag';

import type { WasmInviteNotificationType } from '@proton/andromeda';
import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PublicKeyReference } from '@proton/crypto/lib';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { MAX_RECIPIENTS_PER_TRANSACTIONS, useWalletApiClients } from '@proton/wallet';
import { useBitcoinNetwork } from '@proton/wallet/store';

import { useGetRecipientVerifiedAddressKey } from '../../../hooks/useGetRecipientVerifiedAddressKey';
import type { TxBuilderHelper } from '../../../hooks/useTxBuilder';
import { isUndefined, isValidBitcoinAddress } from '../../../utils';
import type { useEmailAndBtcAddressesMaps } from '../useEmailAndBtcAddressesMaps';
import { InvalidRecipientErrorCode } from '../useEmailAndBtcAddressesMaps';

interface Props {
    recipientHelpers: ReturnType<typeof useEmailAndBtcAddressesMaps>;
    txBuilderHelpers: TxBuilderHelper;
}

export interface WalletNotFoundModalData {
    email: string;
    textContent: string;
    error: InvalidRecipientErrorCode;
    type: WasmInviteNotificationType;
}

export const useRecipientsSelectionStep = ({ recipientHelpers, txBuilderHelpers }: Props) => {
    const {
        recipientEmailMap,
        addValidRecipient,
        addInvalidRecipient,
        removeRecipient,
        exists,
        addRecipientWithSentInvite,
    } = recipientHelpers;

    const { updateTxBuilder, txBuilder } = txBuilderHelpers;

    const getRecipientVerifiedAddressKey = useGetRecipientVerifiedAddressKey();

    const [walletNotFoundModal, setWalletNotFoundModal] = useModalStateWithData<WalletNotFoundModalData>();
    const [inviteSentConfirmModal, setInviteSentConfirmModal] = useModalStateWithData<{ email: string }>();

    const [network] = useBitcoinNetwork();
    const walletApi = useWalletApiClients();

    const { createNotification } = useNotifications();

    const safeAddRecipient = useCallback(
        (recipientOrBitcoinAddress: Recipient, btcAddress: string, addressKey?: PublicKeyReference) => {
            if (!exists(recipientOrBitcoinAddress)) {
                addValidRecipient(recipientOrBitcoinAddress, btcAddress, addressKey);
                updateTxBuilder((txBuilder) => txBuilder.addRecipient(btcAddress));
            }
        },
        [addValidRecipient, exists, updateTxBuilder]
    );

    const handleAddRecipients = useCallback(
        async (recipientOrBitcoinAddresses: Recipient[]) => {
            if (isUndefined(network)) {
                return;
            }

            const remainingSlot = Math.max(
                MAX_RECIPIENTS_PER_TRANSACTIONS - Object.values(recipientEmailMap).length,
                0
            );

            for (const recipientOrBitcoinAddress of recipientOrBitcoinAddresses.slice(0, remainingSlot)) {
                if (validateEmailAddress(recipientOrBitcoinAddress.Address)) {
                    try {
                        const bitcoinAddress = await walletApi.email_integration.lookupBitcoinAddress(
                            recipientOrBitcoinAddress.Address
                        );

                        const btcAddress = bitcoinAddress.Data.BitcoinAddress;
                        const btcAddressSignature = bitcoinAddress.Data.BitcoinAddressSignature;

                        if (!btcAddress) {
                            addInvalidRecipient(
                                recipientOrBitcoinAddress,
                                InvalidRecipientErrorCode.NoAddressSetOnBitcoinAddress
                            );
                            continue;
                        }

                        if (!btcAddressSignature) {
                            addInvalidRecipient(
                                recipientOrBitcoinAddress,
                                InvalidRecipientErrorCode.NoSignatureSetOnBitcoinAddress
                            );
                            continue;
                        }

                        // Bitcoin address signature verification
                        const addressKey = await getRecipientVerifiedAddressKey(recipientOrBitcoinAddress.Address, {
                            btcAddress,
                            btcAddressSignature,
                        });

                        if (!addressKey) {
                            addInvalidRecipient(
                                recipientOrBitcoinAddress,
                                InvalidRecipientErrorCode.BitcoinAddressSignatureCouldNotBeVerified
                            );
                        } else {
                            safeAddRecipient(recipientOrBitcoinAddress, btcAddress, addressKey);
                        }
                    } catch (error: any) {
                        const code = error.code as number;

                        if (code === 2028) {
                            createNotification({ text: error.details, type: 'error' });
                            return;
                        }

                        if (code === 2000) {
                            return addInvalidRecipient(
                                recipientOrBitcoinAddress,
                                InvalidRecipientErrorCode.NoBitcoinAddressAvailable
                            );
                        }

                        const [errorCode, type, textContent] =
                            code === 2001
                                ? ([
                                      InvalidRecipientErrorCode.CouldNotFindProtonWallet,
                                      'Newcomer',
                                      c('Bitcoin send')
                                          .t`This email is not using a ${WALLET_APP_NAME} yet. Invite them to create their own wallet for easier transactions.`,
                                  ] as const)
                                : ([
                                      InvalidRecipientErrorCode.CouldNotFindBitcoinAddressLinkedToEmail,
                                      'EmailIntegration',
                                      c('Bitcoin send')
                                          .t`This user may not have a ${WALLET_APP_NAME} integrated with their email yet. Send them an email to tell them you would like to send them bitcoin.`,
                                  ] as const);

                        setWalletNotFoundModal({
                            email: recipientOrBitcoinAddress.Address,
                            textContent,
                            error: errorCode,
                            type,
                        });

                        addInvalidRecipient(recipientOrBitcoinAddress, errorCode);
                    }
                } else if (isValidBitcoinAddress(recipientOrBitcoinAddress.Address, network)) {
                    safeAddRecipient(recipientOrBitcoinAddress, recipientOrBitcoinAddress.Address);
                } else {
                    addInvalidRecipient(recipientOrBitcoinAddress, InvalidRecipientErrorCode.InvalidAddress);
                }
            }
        },
        [
            addInvalidRecipient,
            createNotification,
            getRecipientVerifiedAddressKey,
            network,
            recipientEmailMap,
            safeAddRecipient,
            setWalletNotFoundModal,
            walletApi.email_integration,
        ]
    );

    const handleRemoveRecipient = useCallback(
        (recipient: Recipient) => {
            const recipientToRemove = recipientEmailMap[recipient.Address];
            const indexToRemove = txBuilder
                .getRecipients()
                .findIndex((r) => r[1] === recipientToRemove?.btcAddress.value);

            updateTxBuilder((txBuilder) => txBuilder.removeRecipient(indexToRemove));
            removeRecipient(recipient);
        },
        [recipientEmailMap, removeRecipient, txBuilder, updateTxBuilder]
    );

    const handleSendEmailInvite = useCallback(
        async (email: string, inviterAddressID: string) => {
            const type =
                walletNotFoundModal.data?.error === InvalidRecipientErrorCode.CouldNotFindProtonWallet
                    ? 'newcomer'
                    : 'bve';

            try {
                if (type === 'bve') {
                    await walletApi.invite.sendEmailIntegrationInvite(email, inviterAddressID);
                } else {
                    await walletApi.invite.sendNewcomerInvite(email, inviterAddressID);
                }

                walletNotFoundModal.onClose();
                setInviteSentConfirmModal({ email });

                addRecipientWithSentInvite(email);
                createNotification({ text: c('Bitcoin send').t`Invitation sent to the recipient` });
            } catch (error: any) {
                createNotification({
                    text:
                        error?.error ??
                        c('Bitcoin send')
                            .t`Invitation could not be sent to recipient. Please check details and try again.`,
                });
            }
        },
        [
            addRecipientWithSentInvite,
            createNotification,
            setInviteSentConfirmModal,
            walletApi.invite,
            walletNotFoundModal,
        ]
    );

    return {
        inviteSentConfirmModal,
        walletNotFoundModal,
        setWalletNotFoundModal,
        handleAddRecipients,
        handleRemoveRecipient,
        handleSendEmailInvite,
    };
};
