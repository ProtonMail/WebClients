import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import Icon from '@proton/components/components/icon/Icon';
import { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import useLoading from '@proton/hooks/useLoading';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { useBitcoinNetwork } from '@proton/wallet/store';

import { Button } from '../../../atoms';
import type { TxBuilderHelper } from '../../../hooks/useTxBuilder';
import { isUndefined } from '../../../utils';
import { EmailOrBitcoinAddressInput } from '../../EmailOrBitcoinAddressInput';
import { InviteSentConfirmModal } from '../../InviteSentConfirmModal';
import { RecipientDetailsModal } from '../../RecipientDetailsModal';
import { WalletNotFoundError } from '../WalletNotFoundError/WalletNotFoundErrorDropdown';
import { WalletNotFoundErrorModal } from '../WalletNotFoundError/WalletNotFoundErrorModal';
import type { useEmailAndBtcAddressesMaps } from '../useEmailAndBtcAddressesMaps';
import { InvalidRecipientErrorCode } from '../useEmailAndBtcAddressesMaps';
import { type WalletNotFoundModalData, useRecipientsSelectionStep } from './useRecipientsSelectionStep';

interface Props {
    apiAccount: WasmApiWalletAccount;
    recipientHelpers: ReturnType<typeof useEmailAndBtcAddressesMaps>;
    onRecipientsConfirm: () => void;
    txBuilderHelpers: TxBuilderHelper;
}

const FetchListRightNode = ({
    email,
    error,
    hasSentInvite,
    setWalletNotFoundModal,
}: {
    email: string;
    error?: InvalidRecipientErrorCode;
    hasSentInvite: boolean;
    setWalletNotFoundModal: (data: WalletNotFoundModalData) => void;
}) => {
    if (error === InvalidRecipientErrorCode.CouldNotFindBitcoinAddressLinkedToEmail) {
        const textContent = c('Bitcoin send')
            .t`This user may not have a ${WALLET_APP_NAME} integrated with their email yet. Send them an email to tell them you would like to send them bitcoin.`;

        return (
            <WalletNotFoundError
                hasSentInvite={hasSentInvite}
                email={email}
                onSendInvite={() => {
                    setWalletNotFoundModal({
                        email,
                        textContent,
                        error,
                        type: 'EmailIntegration',
                    });
                }}
            />
        );
    }

    if (error === InvalidRecipientErrorCode.CouldNotFindProtonWallet) {
        const textContent = c('Bitcoin send')
            .t`This email is not using a ${WALLET_APP_NAME} yet. Invite them to create their own wallet for easier transactions.`;

        return (
            <WalletNotFoundError
                hasSentInvite={hasSentInvite}
                email={email}
                onSendInvite={() => {
                    setWalletNotFoundModal({
                        email,
                        textContent,
                        error,
                        type: 'Newcomer',
                    });
                }}
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
};

export const RecipientsSelectionStep = ({
    apiAccount,
    recipientHelpers,
    txBuilderHelpers,
    onRecipientsConfirm,
}: Props) => {
    const { recipientEmailMap, checkHasSentInvite } = recipientHelpers;

    const { txBuilder } = txBuilderHelpers;

    const { contactEmails, contactEmailsMap } = useContactEmailsCache();
    const [network] = useBitcoinNetwork();

    const [loadingBitcoinAddressLookup, withLoadingBitcoinAddressLookup] = useLoading();
    const [loadingInviteSend, withLoadingInviteSend] = useLoading();

    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<{
        recipient: Recipient;
        btcAddress: string;
        index: number;
    }>();

    const {
        inviteSentConfirmModal,
        walletNotFoundModal,
        setWalletNotFoundModal,
        handleAddRecipients,
        handleRemoveRecipient,
        handleSendEmailInvite,
    } = useRecipientsSelectionStep({
        recipientHelpers,
        txBuilderHelpers,
    });

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
                    fetchedEmailListItemRightNode={({ email, error }) => (
                        <FetchListRightNode
                            email={email}
                            error={error}
                            hasSentInvite={checkHasSentInvite(email)}
                            setWalletNotFoundModal={setWalletNotFoundModal}
                        />
                    )}
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

            {walletNotFoundModal.data && (
                <WalletNotFoundErrorModal
                    onSendInvite={(email, inviterAddressId) => {
                        void withLoadingInviteSend(handleSendEmailInvite(email, inviterAddressId));
                    }}
                    defaultInviterAddressID={apiAccount.Addresses?.[0]?.ID}
                    email={walletNotFoundModal.data.email}
                    textContent={walletNotFoundModal.data.textContent}
                    type={walletNotFoundModal.data.type}
                    loading={loadingInviteSend}
                    checkHasSentInvite={checkHasSentInvite}
                    {...walletNotFoundModal}
                />
            )}

            {inviteSentConfirmModal.data && (
                <InviteSentConfirmModal email={inviteSentConfirmModal.data.email} {...inviteSentConfirmModal} />
            )}
        </>
    );
};
