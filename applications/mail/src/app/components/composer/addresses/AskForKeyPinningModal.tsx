import { OpenPGPKey } from 'pmcrypto';
import { getContact, updateContact } from 'proton-shared/lib/api/contacts';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import { pinKey } from 'proton-shared/lib/contacts/keyPinning';
import { Api } from 'proton-shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import React from 'react';
import { Alert, classnames, FormModal, useApi, useLoading, useNotifications, useUserKeys } from 'react-components';
import { c, msgid } from 'ttag';

interface Props {
    contacts: ContactWithBePinnedPublicKey[];
    onSubmit: () => void;
    onClose: () => void;
    onNotTrust: () => void;
    onError: () => void;
}

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

const AskForKeyPinningModal = ({ contacts, onSubmit, onClose, onNotTrust, onError, ...rest }: Props) => {
    const api = useApi();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [loading, withLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const { privateKeys: allPrivateKeys, publicKeys } = splitKeys(userKeysList);
    const privateKeys = [allPrivateKeys[0]];

    const totalContacts = contacts.length;

    const handleSubmit = async () => {
        try {
            const requests = contacts.map((contact) => () =>
                updateContactPinnedKeys({ contact, api, publicKeys, privateKeys })
            );
            // the routes called in requests support 100 calls every 10 seconds
            await processApiRequestsSafe(requests, 100, 10 * 1000);
            onSubmit();
        } catch (error) {
            createNotification({ text: error.message, type: 'error' });
            onError();
        } finally {
            onClose();
        }
    };
    const handleClose = () => {
        onNotTrust();
        onClose();
    };

    return (
        <FormModal
            title={c('Title').ngettext(msgid`Trust new key?`, `Trust new keys?`, contacts.length)}
            submit={c('Action').ngettext(msgid`Trust key`, `Trust keys`, totalContacts)}
            onSubmit={() => withLoading(handleSubmit())}
            onClose={handleClose}
            loading={loading || loadingUserKeys}
            {...rest}
        >
            <Alert learnMore="https://protonmail.com/support/knowledge-base/address-verification">
                {c('Key pinning').ngettext(
                    msgid`You have enabled Address Verification with Trusted Keys for this email address,
                        but no active encryption key has been trusted.
                        You must trust a key valid for sending in order to send a message to this email address.`,
                    `You have enabled Address Verification with Trusted Keys for email addresses,
                        but no active encryption keys have been trusted.
                        You must trust keys valid for sending in order to send a message to these email addresses.`,
                    totalContacts
                )}
            </Alert>
            <div>
                {c('Key pinning').ngettext(
                    msgid`Do you want to trust the primary public key with the following fingerprint?`,
                    `Do you want to trust the primary public keys with the following fingerprints?`,
                    totalContacts
                )}
                <ul>
                    {contacts.map(({ emailAddress, bePinnedPublicKey }, index) => {
                        const fingerprint = bePinnedPublicKey.getFingerprint();
                        return (
                            <li key={index} className={classnames([index !== totalContacts && 'mb0-5'])}>
                                <span className="bl mw100 ellipsis">{`${emailAddress}: ${fingerprint}`}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </FormModal>
    );
};

export default AskForKeyPinningModal;
