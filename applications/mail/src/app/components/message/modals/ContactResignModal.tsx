import React, { useState, useEffect } from 'react';
import {
    Alert,
    Loader,
    FormModal,
    useGetEncryptionPreferences,
    useApi,
    useLoading,
    useGetUserKeys,
    PrimaryButton
} from 'react-components';
import { resignCards } from 'proton-shared/lib/contacts/resign';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { updateContact } from 'proton-shared/lib/api/contacts';
import { getContact } from 'proton-shared/lib/api/contacts';
import { ContactEmail, ContactCard } from 'proton-shared/lib/interfaces/contacts';
import { c } from 'ttag';

import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
    contactID: string;
    onResignContact: () => void;
    onClose?: () => void;
}

const ContactResignModal = ({ contactID, message, onResignContact, onClose, ...rest }: Props) => {
    const { Name } = message.data?.Sender || {};
    const getUserKeys = useGetUserKeys();
    const [contactFingerprintsByEmailMap, setContactFingerprintsByEmailMap] = useState<{
        [key: string]: string[];
    }>({});
    const [contactCards, setContactCards] = useState<ContactCard[]>([]);
    const [loadingContact, withLoadingContact] = useLoading(true);
    const [loadingResign, withLoadingResign] = useLoading();

    const getEncryptionPreferences = useGetEncryptionPreferences();
    const api = useApi();

    useEffect(() => {
        const getContactFingerprintsByEmailMap = async () => {
            const {
                Contact: { Cards, ContactEmails }
            } = await api(getContact(contactID));

            const fingerprintsByEmail: { [key: string]: string[] } = {};

            await Promise.all(
                ContactEmails.map(async ({ Email }: ContactEmail) => {
                    const { pinnedKeys } = await getEncryptionPreferences(Email);
                    const fingerprints = pinnedKeys.map((key) => key.getFingerprint());
                    fingerprintsByEmail[Email] = fingerprints;
                })
            );

            setContactFingerprintsByEmailMap(fingerprintsByEmail);
            setContactCards(Cards);
        };

        withLoadingContact(getContactFingerprintsByEmailMap());
    }, []);

    const handleSubmit = async () => {
        const { privateKeys } = splitKeys(await getUserKeys());

        if (!contactCards || loadingContact) {
            return;
        }

        const resignedCards = await resignCards({
            contactCards,
            privateKeys: [privateKeys[0]]
        });

        await api(updateContact(contactID, { Cards: resignedCards }));
        onResignContact();
        onClose?.();
    };

    const renderEmailRow = (email: string) => {
        const fingerprints = contactFingerprintsByEmailMap[email];

        return (
            <li key={email}>
                <strong>{`${email}: `}</strong>
                {fingerprints.map((f: string, i: number) => (
                    <span key={f}>{`${f}${i + 1 !== fingerprints.length ? ',' : ''}`}</span>
                ))}
            </li>
        );
    };

    const renderSubmit = (
        <PrimaryButton disabled={loadingContact || !contactCards.length} loading={loadingResign} type="submit">
            {c('Action').t`Trust`}
        </PrimaryButton>
    );

    return (
        <FormModal
            title={c('Info').t`Trust pinned keys?`}
            onSubmit={() => withLoadingResign(handleSubmit())}
            onClose={onClose}
            loading={loadingResign}
            submit={renderSubmit}
            {...rest}
        >
            <Alert type="info">
                {c('Info')
                    .t`When you enabled trusted keys for ${Name}, the public keys were added to the contact details.`}
            </Alert>
            <Alert type="error">
                {c('Info')
                    .t`There has been an error with the signature used to verify the contact details, which may be the result of a password reset.`}
            </Alert>
            <Alert type="info">
                {c('Info')
                    .t`Do you want to re-sign the contact details and in the process trust the keys with the following fingerprints?`}
            </Alert>
            {loadingContact ? (
                <Loader />
            ) : (
                <div>
                    <ul>{Object.keys(contactFingerprintsByEmailMap).map(renderEmailRow)}</ul>
                </div>
            )}
        </FormModal>
    );
};

export default ContactResignModal;
