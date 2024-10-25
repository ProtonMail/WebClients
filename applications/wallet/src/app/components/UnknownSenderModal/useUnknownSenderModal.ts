import { useCallback, useEffect, useState } from 'react';

import compact from 'lodash/compact';
import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useSaveVCardContact } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { useNotifications } from '@proton/components/hooks';
import { useContactEmails } from '@proton/mail/contactEmails/hooks';
import { addVCardProperty } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { type DecryptedTransactionData, type SenderObject, encryptPgp, useWalletApi } from '@proton/wallet';
import { updateWalletTransaction, useApiWalletTransactionData, useWalletDispatch } from '@proton/wallet/store';

const senderName = (apiData?: DecryptedTransactionData) => {
    if (typeof apiData?.Sender === 'string') {
        return '';
    } else {
        return apiData?.Sender?.name ?? '';
    }
};

const senderEmail = (apiData?: DecryptedTransactionData) => {
    if (typeof apiData?.Sender === 'string') {
        return '';
    } else {
        return apiData?.Sender?.email ?? '';
    }
};

export const useUnknownSenderModal = ({ hashedTxId, onClose }: { hashedTxId: string; onClose?: () => void }) => {
    const [walletTransactions] = useApiWalletTransactionData([hashedTxId]);
    const apiWalletTransaction = walletTransactions?.[hashedTxId];

    const [contacts] = useContactEmails();
    const [shouldSaveAsContact, setShouldSaveAsContact] = useState(false);
    const dispatch = useWalletDispatch();

    const [name, setName] = useState(senderName(apiWalletTransaction));
    const [email, setEmail] = useState(senderEmail(apiWalletTransaction));

    const alreadyExistsAsContact = contacts?.some((e) => e.Email === email || e.Name === name);

    const walletApi = useWalletApi();
    const [userKeys, loadingUserKeys] = useUserKeys();

    const { createNotification } = useNotifications();
    const [error, setError] = useState<string | null>(null);

    const saveVCardContact = useSaveVCardContact();

    const checkData = useCallback(() => {
        if (!!name) {
            setError(null);
            return true;
        }

        if (!validateEmailAddress(email)) {
            setError(c('Unknown sender').t`Email address is invalid`);
            return false;
        }

        setError(null);
        return true;
    }, [email, name]);

    useEffect(() => {
        if (error) {
            checkData();
        }
    }, [checkData, error]);

    const createContact = async () => {
        const properties = compact([
            name &&
                ({
                    field: 'fn',
                    value: name,
                } as VCardProperty),
            email &&
                ({
                    field: 'email',
                    value: email,
                } as VCardProperty),
        ]);

        if (!properties.length) {
            return;
        }

        const vcardToCreate = properties.reduce(
            (acc, property) => {
                const { newVCardContact } = addVCardProperty(acc, property);

                return newVCardContact;
            },
            { fn: [] } as VCardContact
        );

        await saveVCardContact(undefined, vcardToCreate);
    };

    const handleClickSaveSender = async () => {
        //  !walletTransaction.WalletAccountID below is a typeguard, should be removed when API makes it non-nullable anymore
        if (!checkData() || !userKeys || !apiWalletTransaction?.WalletAccountID) {
            return;
        }

        try {
            const [primaryUserKey] = userKeys;

            const parsedSender: SenderObject = { name, email };
            const serialisedSender = JSON.stringify(parsedSender);

            const encryptedSender = await encryptPgp(serialisedSender, [primaryUserKey.privateKey]);

            await walletApi
                .clients()
                .wallet.updateExternalWalletTransactionSender(
                    apiWalletTransaction.WalletID,
                    apiWalletTransaction.WalletAccountID,
                    apiWalletTransaction.ID,
                    encryptedSender
                );

            if (!alreadyExistsAsContact && shouldSaveAsContact) {
                await createContact();
            }

            // Typeguard
            if (apiWalletTransaction.HashedTransactionID) {
                dispatch(
                    updateWalletTransaction({
                        hashedTransactionId: apiWalletTransaction.HashedTransactionID,
                        update: { Sender: parsedSender },
                    })
                );
            }

            onClose?.();
            createNotification({ text: c('Unknown sender').t`Transaction sender has been updated successfully` });
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Unknown sender').t`Transaction sender could not be updated`,
            });
        }
    };

    return {
        name,
        email,
        error,
        shouldSaveAsContact,
        loadingUserKeys,
        alreadyExistsAsContact,
        setName,
        setEmail,
        setShouldSaveAsContact,
        handleClickSaveSender,
    };
};
