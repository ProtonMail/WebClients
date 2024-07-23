import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount, WasmTxBuilder } from '@proton/andromeda';
import { Icon, useModalStateWithData } from '@proton/components/components';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { useApi, useNotifications } from '@proton/components/hooks';
import type { PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { ProcessedApiKey, Recipient } from '@proton/shared/lib/interfaces';
import { getKeyHasFlagsToVerify } from '@proton/shared/lib/keys';
import { useBitcoinNetwork, useWalletApiClients, verifySignedData } from '@proton/wallet';
import { MAX_RECIPIENTS_PER_TRANSACTIONS } from '@proton/wallet/utils/email-integration';

import { Button } from '../../atoms';
import type { TxBuilderUpdater } from '../../hooks/useTxBuilder';
import { isUndefined, isValidBitcoinAddress } from '../../utils';
import { EmailOrBitcoinAddressInput } from '../EmailOrBitcoinAddressInput';
import type { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { InvalidRecipientErrorCode } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';
import { RecipientDetailsModal } from '../RecipientDetailsModal';
import { WalletNotFoundErrorDropdown } from './WalletNotFoundError/WalletNotFoundErrorDropdown';
import { WalletNotFoundErrorModal } from './WalletNotFoundError/WalletNotFoundErrorModal';

interface Props {
    apiAccount: WasmApiWalletAccount;
    recipientHelpers: ReturnType<typeof useEmailAndBtcAddressesMaps>;
    onRecipientsConfirm: () => void;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
}

interface WalletNotFoundModalData {
    email: string;
    textContent: string;
    error: InvalidRecipientErrorCode;
    inviterAddressID?: string;
}

const getVerifiedAddressKey = async (
    addressKeys: ProcessedApiKey[],
    btcAddress: string,
    btcAddressSignature: string
): Promise<PublicKeyReference | undefined> => {
    const keys = await Promise.allSettled(
        addressKeys
            .filter((k) => {
                return getKeyHasFlagsToVerify(k.flags);
            })
            .map(async (addressKey) => {
                const pubkey = await CryptoProxy.importPublicKey({ armoredKey: addressKey.armoredKey });
                const isVerified = await verifySignedData(btcAddress, btcAddressSignature, 'wallet.bitcoin-address', [
                    pubkey,
                ]);

                return isVerified ? pubkey : null;
            })
    );

    const [firstAddressKey] = keys
        .map((result) => ('value' in result ? result.value : undefined))
        .filter((key): key is PublicKeyReference => !!key);

    return firstAddressKey;
};

export const RecipientsSelection = ({
    apiAccount,
    recipientHelpers,
    txBuilder,
    onRecipientsConfirm,
    updateTxBuilder,
}: Props) => {
    const {
        recipientEmailMap,
        addValidRecipient,
        addInvalidRecipient,
        removeRecipient,
        exists,
        addRecipientWithSentInvite,
        checkHasSentInvite,
    } = recipientHelpers;

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { contactEmails, contactEmailsMap } = useContactEmailsCache();
    const [loadingBitcoinAddressLookup, withLoadingBitcoinAddressLookup] = useLoading();
    const [walletNotFoundModal, setWalletNotFoundModal] = useModalStateWithData<WalletNotFoundModalData>();
    const { createNotification } = useNotifications();
    const [inviteSentConfirmModal, setInviteSentConfirmModal] = useModalStateWithData<{ email: string }>();
    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<{
        recipient: Recipient;
        btcAddress: string;
        index: number;
    }>();
    const [network] = useBitcoinNetwork();
    const walletApi = useWalletApiClients();
    const api = useApi();

    const inviterAddressID = apiAccount.Addresses?.[0]?.ID;
    const [canSendInvite, setCanSendInvite] = useState(false);

    useEffect(() => {
        setCanSendInvite(!!inviterAddressID);
    }, [inviterAddressID]);

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

    const handleSendEmailIntegrationInvite = async (email: string) => {
        try {
            await walletApi.invite.sendEmailIntegrationInvite(email, inviterAddressID);

            walletNotFoundModal.onClose();
            setInviteSentConfirmModal({ email });

            addRecipientWithSentInvite(email);
            createNotification({ text: c('Bitcoin send').t`Invitation sent to the recipient` });
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Bitcoin send').t`Could not send invitation to the recipient`,
            });
        }
    };

    const handleSendNewcomerInvite = async (email: string) => {
        try {
            await walletApi.invite.sendNewcomerInvite(email, inviterAddressID);

            walletNotFoundModal.onClose();
            setInviteSentConfirmModal({ email });

            addRecipientWithSentInvite(email);
            createNotification({ text: c('Bitcoin send').t`Invitation sent to the recipient` });
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Bitcoin send').t`Could not send invitation to the recipient`,
            });
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
                    const { addressKeys } = await getAndVerifyApiKeys({
                        api,
                        email: recipientOrBitcoinAddress.Address,
                        internalKeysOnly: true,
                        verifyOutboundPublicKeys,
                    });

                    const addressKey = await getVerifiedAddressKey(addressKeys, btcAddress, btcAddressSignature);

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

                    const [errorCode, type, text] =
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

                    const checkHasRecipientSentInvite = () => {
                        if (!inviterAddressID || checkHasSentInvite(recipientOrBitcoinAddress.Address)) {
                            return false;
                        }

                        return walletApi.invite
                            .checkInviteStatus(recipientOrBitcoinAddress.Address, type, inviterAddressID)
                            .then(() => false)
                            .catch(() => {
                                setCanSendInvite(false);
                            });
                    };

                    if (await checkHasRecipientSentInvite()) {
                        addRecipientWithSentInvite(recipientOrBitcoinAddress.Address);
                    } else {
                        setWalletNotFoundModal({
                            email: recipientOrBitcoinAddress.Address,
                            textContent: text,
                            error: errorCode,
                            inviterAddressID: inviterAddressID,
                        });
                    }

                    addInvalidRecipient(recipientOrBitcoinAddress, errorCode);
                }
            } else if (isValidBitcoinAddress(recipientOrBitcoinAddress.Address, network)) {
                safeAddRecipient(recipientOrBitcoinAddress, recipientOrBitcoinAddress.Address);
            } else {
                addInvalidRecipient(recipientOrBitcoinAddress, InvalidRecipientErrorCode.InvalidAddress);
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
        <>
            <div className="relative flex flex-column max-w-full justify-center">
                <h2 className="text-center mb-8 text-semibold">{c('Wallet send')
                    .t`Who are you sending Bitcoin to?`}</h2>

                <EmailOrBitcoinAddressInput
                    disabled={Object.values(loadingBitcoinAddressLookup).some((v) => Boolean(v))}
                    placeholder={'andy.yen@proton.ch / bc1...'}
                    contactEmails={contactEmails}
                    contactEmailsMap={contactEmailsMap}
                    recipientEmailMap={recipientEmailMap}
                    network={network}
                    loading={loadingBitcoinAddressLookup}
                    fetchedEmailListItemRightNode={({ email, error }) => {
                        if (error === InvalidRecipientErrorCode.CouldNotFindBitcoinAddressLinkedToEmail) {
                            return (
                                <WalletNotFoundErrorDropdown
                                    canSendInvite={canSendInvite}
                                    hasSentInvite={checkHasSentInvite(email)}
                                    email={email}
                                    onSendInvite={handleSendEmailIntegrationInvite}
                                    textContent={c('Bitcoin send')
                                        .t`This user may not have a ${WALLET_APP_NAME} integrated with their email yet. Send them an email to tell them you would like to send them bitcoin.`}
                                />
                            );
                        }

                        if (error === InvalidRecipientErrorCode.CouldNotFindProtonWallet) {
                            return (
                                <WalletNotFoundErrorDropdown
                                    canSendInvite={canSendInvite}
                                    hasSentInvite={checkHasSentInvite(email)}
                                    email={email}
                                    onSendInvite={handleSendNewcomerInvite}
                                    textContent={c('Bitcoin send')
                                        .t`This email is not using a ${WALLET_APP_NAME} yet. Invite them to create their own wallet for easier transactions.`}
                                />
                            );
                        }

                        if (error === InvalidRecipientErrorCode.InvalidAddress) {
                            return (
                                <span className="block text-sm color-danger w-1/3">{c('Wallet send')
                                    .t`Address is neither a valid bitcoin or email address`}</span>
                            );
                        }

                        if (error === InvalidRecipientErrorCode.NoBitcoinAddressAvailable) {
                            return (
                                <span className="block text-sm color-danger w-1/3">{c('Wallet send')
                                    .t`Recipient has no bitcoin address available`}</span>
                            );
                        }

                        if (error) {
                            return (
                                <span className="block text-sm color-danger w-1/3">{c('Wallet send')
                                    .t`Bitcoin address signature could not be verified`}</span>
                            );
                        }

                        return (
                            <span className="mr-1 color-weak shrink-0">
                                <Icon name="chevron-right" className="my-auto" />
                            </span>
                        );
                    }}
                    onClickRecipient={(recipient, btcAddress, index) => {
                        if (btcAddress.value) {
                            setRecipientDetailsModal({ recipient, btcAddress: btcAddress.value, index });
                        }
                    }}
                    onAddRecipients={(recipients: Recipient[]) => {
                        void withLoadingBitcoinAddressLookup(handleAddRecipients(recipients));
                    }}
                    onRemoveRecipient={(recipient: Recipient) => handleRemoveRecipient(recipient)}
                />

                {txBuilder.getRecipients().length ? (
                    <div className="px-10 mt-6">
                        <Button
                            color="norm"
                            shape="solid"
                            size="large"
                            shadow
                            fullWidth
                            onClick={() => {
                                onRecipientsConfirm();
                            }}
                        >{c('Wallet send').t`Confirm`}</Button>
                    </div>
                ) : null}
            </div>

            {recipientDetailsModal.data && (
                <RecipientDetailsModal {...recipientDetailsModal.data} {...recipientDetailsModal} />
            )}

            {walletNotFoundModal.data && canSendInvite && (
                <WalletNotFoundErrorModal
                    onSendInvite={
                        walletNotFoundModal.data.error === InvalidRecipientErrorCode.CouldNotFindProtonWallet
                            ? handleSendNewcomerInvite
                            : handleSendEmailIntegrationInvite
                    }
                    email={walletNotFoundModal.data.email}
                    textContent={walletNotFoundModal.data.textContent}
                    {...walletNotFoundModal}
                />
            )}

            {inviteSentConfirmModal.data && (
                <InviteSentConfirmModal email={inviteSentConfirmModal.data.email} {...inviteSentConfirmModal} />
            )}
        </>
    );
};
