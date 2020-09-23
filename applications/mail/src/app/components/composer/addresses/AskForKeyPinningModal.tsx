import { OpenPGPKey } from 'pmcrypto';
import { getContact, updateContact } from 'proton-shared/lib/api/contacts';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import { pinKeyUpdateContact } from 'proton-shared/lib/contacts/keyPinning';
import { Api } from 'proton-shared/lib/interfaces';
import { ContactCard, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import React from 'react';
import { Alert, classnames, FormModal, useApi, useLoading, useNotifications, useUserKeys } from 'react-components';
import { c, msgid } from 'ttag';

interface Params {
    contact: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>;
    api: Api;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}
const updateContactPinnedKeys = async ({ contact, api, publicKeys, privateKeys }: Params) => {
    const { contactID, isInternal, emailAddress, bePinnedPublicKey } = contact;
    const {
        Contact: { Cards: contactCards }
    } = await api<{ Contact: { Cards: ContactCard[] } }>(getContact(contactID));
    const updatedContactCards = await pinKeyUpdateContact({
        contactCards,
        emailAddress,
        isInternal,
        bePinnedPublicKey,
        publicKeys,
        privateKeys
    });
    await api(updateContact(contactID, { Cards: updatedContactCards }));
};

interface Props {
    contacts: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>[];
    onTrust: () => void;
    onClose: () => void;
    onNotTrust: () => void;
    onError: () => void;
}
const AskForKeyPinningModal = ({ contacts, onTrust, onClose, onNotTrust, onError, ...rest }: Props) => {
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
            onTrust();
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
                    `You have enabled Address Verification with Trusted Keys for these email addresses,
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
