import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import compact from 'lodash/compact';
import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Checkbox, Tooltip } from '@proton/components';
import { useSaveVCardContact } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { useContactEmails, useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { addVCardProperty } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import walletNotFoundImg from '@proton/styles/assets/img/illustrations/wallet_not_found.svg';
import clsx from '@proton/utils/clsx';
import { type SenderObject, type TransactionData, encryptPgp, useWalletApi } from '@proton/wallet';
import { updateWalletTransaction, useWalletDispatch } from '@proton/wallet/store';

import { Button, Input, Modal } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';

export interface WalletCreationModalOwnProps {
    walletTransaction: TransactionData;
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

export const UnknownSenderModal = ({ walletTransaction, ...modalProps }: Props) => {
    const [contacts] = useContactEmails();
    const [shouldSaveAsContact, setShouldSaveAsContact] = useState(false);
    const dispatch = useWalletDispatch();

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
        if (!checkData() || !userKeys || !walletTransaction.apiData || !walletTransaction.apiData?.WalletAccountID) {
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
                    walletTransaction.apiData.WalletID,
                    walletTransaction.apiData.WalletAccountID,
                    walletTransaction.apiData.ID,
                    encryptedSender
                );

            if (!alreadyExistsAsContact && shouldSaveAsContact) {
                await createContact();
            }

            createNotification({ text: c('Unknown sender').t`Transaction sender has been updated succesfully` });

            // Typeguard
            if (walletTransaction.apiData.HashedTransactionID) {
                dispatch(
                    updateWalletTransaction({
                        hashedTransactionId: walletTransaction.apiData.HashedTransactionID,
                        update: { Sender: parsedSender },
                    })
                );
            }
        } catch {
            createNotification({ text: c('Unknown sender').t`Transaction sender could not be updated` });
        }
    };

    return (
        <Modal size="small" {...modalProps}>
            <div className="flex flex-column items-center">
                <img src={walletNotFoundImg} alt="" className="mb-7" style={{ width: '3rem' }} />
                <h1 className={clsx('text-bold text-break text-3xl mb-2')}>{c('Unknown sender').t`Unknown sender`}</h1>
                <ModalParagraph>
                    <p>{c('Unknown sender').t`Not a Bitcoin via Email transaction.`}</p>
                    <p>{c('Unknown sender').t`Add a name so you can remember who it was from.`}</p>
                </ModalParagraph>
                <div className="w-full flex flex-column">
                    <div>
                        <Input
                            label={c('Unknown sender').t`Name`}
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
                            placeholder={c('Unknown sender').t`Add their email address or leave empty`}
                            value={email}
                            error={error}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setEmail(e.target.value);
                                if (!e.target.value) {
                                    setShouldSaveAsContact(false);
                                }
                            }}
                        />
                    </div>

                    {!alreadyExistsAsContact && (
                        <div className="flex flex-row items-start mt-2 gap-2">
                            <Tooltip
                                title={!email && c('Unknown sender').t`Add their email address to save as contact`}
                            >
                                <div className="block">
                                    <Checkbox
                                        id="save-as-contact"
                                        disabled={!email}
                                        checked={shouldSaveAsContact}
                                        onClick={() => {
                                            setShouldSaveAsContact((prev) => !prev);
                                        }}
                                    />
                                    <label className="ml-2" htmlFor="save-as-contact">{c('Unknown sender')
                                        .t`Save as a contact`}</label>
                                </div>
                            </Tooltip>
                        </div>
                    )}
                </div>

                <Button
                    fullWidth
                    className="my-8 mx-auto"
                    size="large"
                    shape="solid"
                    color="norm"
                    disabled={!(email || name) || loadingSenderUpdate || loadingUserKeys || !!error}
                    onClick={() => {
                        void withLoadingSenderUpdate(handleClickSaveSender());
                    }}
                >{c('Unknown sender').t`Save sender`}</Button>
            </div>
        </Modal>
    );
};
