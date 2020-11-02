import { API_CODES, CONTACT_CARD_TYPE } from 'proton-shared/lib/constants';
import React from 'react';
import {
    Alert,
    FormModal,
    PrimaryButton,
    useApi,
    useGetUserKeys,
    useLoading,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { addContacts, getContact, updateContact } from 'proton-shared/lib/api/contacts';
import { pinKeyCreateContact, pinKeyUpdateContact } from 'proton-shared/lib/contacts/keyPinning';
import { Api } from 'proton-shared/lib/interfaces';
import { ContactCard, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import SimplePublicKeyTable from './SimplePublicKeyTable';

interface ParamsUpdate {
    contact: Required<ContactWithBePinnedPublicKey>;
    api: Api;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}
const updateContactPinnedKeys = async ({ contact, api, publicKeys, privateKeys }: ParamsUpdate) => {
    const { contactID, emailAddress, bePinnedPublicKey, isInternal } = contact;
    const {
        Contact: { Cards: contactCards },
    } = await api<{ Contact: { Cards: ContactCard[] } }>(getContact(contactID));
    const hasSignedCard = !!contactCards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
    const hasEncryptedCard = !!contactCards.find(({ Type }) =>
        [CONTACT_CARD_TYPE.ENCRYPTED, CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED].includes(Type)
    );
    if (hasEncryptedCard && !hasSignedCard) {
        throw new Error('Corrupted contact card data');
    }
    // If no signed card is present, that means the contact was created by the server,
    // and we can simply create a new contact
    const updatedContactCards = hasSignedCard
        ? await pinKeyUpdateContact({
              contactCards,
              emailAddress,
              isInternal,
              bePinnedPublicKey,
              publicKeys,
              privateKeys,
          })
        : await pinKeyCreateContact({
              emailAddress,
              isInternal,
              bePinnedPublicKey,
              privateKeys,
          });
    await api(updateContact(contactID, { Cards: updatedContactCards }));
};

interface ParamsCreate {
    contact: ContactWithBePinnedPublicKey;
    api: Api;
    privateKeys: OpenPGPKey[];
}
const createContactPinnedKeys = async ({ contact, api, privateKeys }: ParamsCreate) => {
    const { emailAddress, name, isInternal, bePinnedPublicKey } = contact;
    const contactCards = await pinKeyCreateContact({
        emailAddress,
        name,
        isInternal,
        bePinnedPublicKey,
        privateKeys,
    });
    return api<{ Code: number; Responses: { Response: { Code: number } }[] }>(
        addContacts({ Contacts: [{ Cards: contactCards }], Overwrite: 1, Labels: 0 })
    );
};

interface Props {
    contact: ContactWithBePinnedPublicKey;
    onSubmit?: () => void;
    onClose?: () => void;
}
const TrustPublicKeyModal = ({ contact, onSubmit, ...rest }: Props) => {
    const api = useApi();
    const getUserKeys = useGetUserKeys();
    const [loading, withLoading] = useLoading(false);
    const { createNotification } = useNotifications();

    const isCreateContact = !contact.contactID;

    const handleUpdateContact = async () => {
        const { privateKeys: allPrivateKeys, publicKeys } = splitKeys(await getUserKeys());
        const privateKeys = [allPrivateKeys[0]];
        await updateContactPinnedKeys({
            contact: contact as Required<ContactWithBePinnedPublicKey>,
            api,
            publicKeys,
            privateKeys,
        });
        createNotification({ text: c('Success').t`Public key trusted`, type: 'success' });
        onSubmit?.();
        rest.onClose?.();
    };
    const handleCreateContact = async () => {
        const { privateKeys: allPrivateKeys } = splitKeys(await getUserKeys());
        const privateKeys = [allPrivateKeys[0]];
        const {
            Responses: [
                {
                    Response: { Code },
                },
            ],
        } = await createContactPinnedKeys({ contact, api, privateKeys });
        if (Code !== API_CODES.SINGLE_SUCCESS) {
            createNotification({ text: c('Error').t`Public key could not be trusted`, type: 'error' });
            rest.onClose?.();
            return;
        }
        createNotification({ text: c('Success').t`Public key trusted`, type: 'success' });
        onSubmit?.();
        rest.onClose?.();
    };
    const handleSubmit = isCreateContact ? handleCreateContact : handleUpdateContact;

    const submit = (
        <PrimaryButton loading={loading} type="submit">
            {c('Action').t`Trust key`}
        </PrimaryButton>
    );
    const alertMessage = isCreateContact
        ? c('Key pinning').t`Clicking "Trust Key" will create a new contact and associate this public key with
        this sender. Emails from this address will be automatically cryptographically verified.`
        : c('Key pinning').t`Clicking "Trust Key" will associate this public key with this sender
        and emails from this address will be automatically cryptographically verified.`;

    return (
        <FormModal
            title={c('Title').t`Trust public key?`}
            submit={submit}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            {...rest}
        >
            <Alert learnMore="https://protonmail.com/support/knowledge-base/address-verification">{alertMessage}</Alert>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                {c('Info').t`This public key will be automatically used for encrypting email sent to this address.`}
            </Alert>
            <div>
                <div className="mb0-5">{c('Key pinning').t`Do you want to trust the following public key?`}</div>
                <SimplePublicKeyTable contact={contact} />
            </div>
        </FormModal>
    );
};

export default TrustPublicKeyModal;
