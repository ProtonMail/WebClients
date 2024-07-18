import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmApiWalletTransaction } from '@proton/andromeda';
import { Checkbox, ModalOwnProps } from '@proton/components/components';
import { useSaveVCardContact } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { useContactEmails, useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { addVCardProperty } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import walletNotFoundImg from '@proton/styles/assets/img/illustrations/wallet_not_found.svg';
import clsx from '@proton/utils/clsx';
import { encryptPgp, useWalletApi } from '@proton/wallet';

import { Button, Input, Modal } from '../../atoms';
import { SenderObject, TransactionData } from '../../hooks/useWalletTransactions';

export interface WalletCreationModalOwnProps {
    walletTransaction: TransactionData;
    onUpdate: (updated: WasmApiWalletTransaction, oldTransaction: TransactionData) => void;
}

type Props = ModalOwnProps & WalletCreationModalOwnProps;

const senderName = (tx: TransactionData) => {
    if (typeof tx.apiData?.Sender === 'string') {
        return '';
    } else {
        return tx.apiData?.Sender?.name ?? '';
    }
};

const senderEmail = (tx: TransactionData) => {
    if (typeof tx.apiData?.Sender === 'string') {
        return '';
    } else {
        return tx.apiData?.Sender?.email ?? '';
    }
};

export const UnknownSenderModal = ({ walletTransaction, onUpdate, ...modalProps }: Props) => {
    const [contacts] = useContactEmails();
    const [shouldSaveAsContact, setShouldSaveAsContact] = useState(false);

    const [name, setName] = useState(senderName(walletTransaction));
    const [email, setEmail] = useState(senderEmail(walletTransaction));

    const alreadyExistsAsContact = contacts?.some((e) => e.Email === email || e.Name === name);

    const walletApi = useWalletApi();

    const [userKeys, loadingUserKeys] = useUserKeys();

    const { createNotification } = useNotifications();
    const [loadingSenderUpdate, withLoadingSenderUpdate] = useLoading();
    const [error, setError] = useState<string | null>(null);

    const saveVCardContact = useSaveVCardContact();

    const checkData = useCallback(() => {
        if (!validateEmailAddress(email)) {
            setError(c('Unknown sender').t`Email address is invalid`);
            return false;
        }

        setError(null);
        return true;
    }, [email]);

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
        if (!checkData() || !userKeys || !walletTransaction.apiData || !walletTransaction.apiData?.WalletAccountID) {
            return;
        }

        try {
            const [primaryUserKey] = userKeys;

            const parsedSender: SenderObject = { name, email };
            const serialisedSender = JSON.stringify(parsedSender);

            const encryptedSender = await encryptPgp(serialisedSender, [primaryUserKey.privateKey]);

            const updatedWalletTransaction = await walletApi
                .clients()
                .wallet.updateExternalWalletTransactionSender(
                    walletTransaction.apiData.WalletID,
                    walletTransaction.apiData.WalletAccountID,
                    walletTransaction.apiData.ID,
                    encryptedSender
                );

            if (!alreadyExistsAsContact && shouldSaveAsContact) {
                await createContact();
            }

            createNotification({ text: c('Unknown sender').t`Transaction sender has been updated succesfully` });
            onUpdate(updatedWalletTransaction.Data, walletTransaction);
        } catch {
            createNotification({ text: c('Unknown sender').t`Transaction sender could not be updated` });
        }
    };

    return (
        <Modal {...modalProps}>
            <div className="flex flex-column items-center">
                <img src={walletNotFoundImg} alt="" className="mb-7" style={{ width: '3rem' }} />
                <h1 className={clsx('text-bold text-break text-2xl')}>{c('Unknown sender').t`Unknown sender`}</h1>
                <p className="text-center color-weak mb-8">{c('Unknown sender')
                    .t`Not a Bitcoin via Email transaction. Add a name so you can remember who it was from.`}</p>

                <div className="w-full flex flex-column mt-4">
                    <div>
                        <Input
                            label={c('Unknown sender').t`Name (optional)`}
                            placeholder={c('Unknown sender').t`Give a name to this sender`}
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setName(e.target.value);
                            }}
                        />
                    </div>

                    <div className="mt-2">
                        <Input
                            label={c('Unknown sender').t`Email address`}
                            placeholder={c('Unknown sender').t`Add their email address`}
                            value={email}
                            error={error}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setEmail(e.target.value);
                            }}
                        />
                    </div>

                    <div className="flex flex-row items-start mt-2">
                        <Checkbox
                            className="bg-weak"
                            disabled={alreadyExistsAsContact}
                            checked={alreadyExistsAsContact || shouldSaveAsContact}
                            onClick={() => {
                                setShouldSaveAsContact((prev) => !prev);
                            }}
                        />
                        <label className="ml-2">{c('Unknown sender').t`Save as a contact`}</label>
                    </div>
                </div>

                <div className="w-full px-8">
                    <Button
                        fullWidth
                        className="my-8 mx-auto"
                        size="large"
                        shape="solid"
                        color="norm"
                        disabled={(!email && !name) || loadingSenderUpdate || loadingUserKeys || !!error}
                        onClick={() => {
                            void withLoadingSenderUpdate(handleClickSaveSender());
                        }}
                    >{c('Unknown sender').t`Save sender`}</Button>
                </div>
            </div>
        </Modal>
    );
};
