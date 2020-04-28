import React from 'react';
import { Alert, FormModal, PrimaryButton, useApi, useLoading, useNotifications, useUserKeys } from 'react-components';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { getContact, updateContact } from 'proton-shared/lib/api/contacts';
import { pinKey } from 'proton-shared/lib/contacts/keyPinning';
import { Api } from 'proton-shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import SimplePublicKeyTable from './SimplePublicKeyTable';

interface Params {
    contact: ContactWithBePinnedPublicKey;
    api: Api;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}

const updateContactPinnedKeys = async ({ contact, api, publicKeys, privateKeys }: Params) => {
    const { contactID, emailAddress, bePinnedPublicKey } = contact;
    const {
        Contact: { Cards: contactCards }
    } = await api(getContact(contactID));
    const updatedContactCards = await pinKey({
        contactCards,
        emailAddress,
        bePinnedPublicKey,
        publicKeys,
        privateKeys
    });
    await api(updateContact(contactID, { Cards: updatedContactCards }));
};

interface Props {
    contact: ContactWithBePinnedPublicKey;
    onSubmit?: () => void;
    onClose?: () => void;
}

const TrustPublicKeyModal = ({ contact, onSubmit, ...rest }: Props) => {
    const api = useApi();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [loading, withLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const { privateKeys: allPrivateKeys, publicKeys } = splitKeys(userKeysList);
    const privateKeys = [allPrivateKeys[0]];

    const handleSubmit = async () => {
        await updateContactPinnedKeys({ contact, api, publicKeys, privateKeys });
        createNotification({ text: c('Success').t`Public key trusted`, type: 'success' });
        onSubmit?.();
        rest.onClose?.();
    };

    const submit = (
        <PrimaryButton disabled={loadingUserKeys} loading={loading} type="submit">
            {c('Action').t`Trust key`}
        </PrimaryButton>
    );

    return (
        <FormModal
            title={c('Title').t`Trust public key?`}
            submit={submit}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading || loadingUserKeys}
            {...rest}
        >
            <Alert learnMore="https://protonmail.com/support/knowledge-base/address-verification">
                {c('Key pinning').t`Clicking "Trust Key" will associate this public key with this sender
                and emails from this address will be automatically cryptographically verified.`}
            </Alert>
            <div>
                <div className="mb0-5">{c('Key pinning').t`Do you want to trust the following public key?`}</div>
                <SimplePublicKeyTable contact={contact} />
            </div>
        </FormModal>
    );
};

export default TrustPublicKeyModal;
