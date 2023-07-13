import { FormEvent } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import {
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useApi,
    useNotifications,
    useUserKeys,
} from '@proton/components';
import { PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { getContact, updateContact } from '@proton/shared/lib/api/contacts';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { pinKeyUpdateContact } from '@proton/shared/lib/contacts/keyPinning';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Api } from '@proton/shared/lib/interfaces';
import { ContactCard, ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import clsx from '@proton/utils/clsx';

interface Params {
    contact: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>;
    api: Api;
    publicKeys: PublicKeyReference[];
    privateKeys: PrivateKeyReference[];
}

const updateContactPinnedKeys = async ({ contact, api, publicKeys, privateKeys }: Params) => {
    const { contactID, isInternal, emailAddress, bePinnedPublicKey } = contact;
    const {
        Contact: { Cards: contactCards },
    } = await api<{ Contact: { Cards: ContactCard[] } }>(getContact(contactID));
    const updatedContactCards = await pinKeyUpdateContact({
        contactCards,
        emailAddress,
        isInternal,
        bePinnedPublicKey,
        publicKeys,
        privateKeys,
    });
    await api(updateContact(contactID, { Cards: updatedContactCards }));
};

interface Props extends ModalProps {
    contacts: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>[];
    onNotTrust: () => void;
    onError: () => void;
    onResolve: () => void;
    onReject: () => void;
}

const AskForKeyPinningModal = ({ contacts, onNotTrust, onError, onResolve, onReject, ...rest }: Props) => {
    const api = useApi();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [loading, withLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const { privateKeys: allPrivateKeys, publicKeys } = splitKeys(userKeysList);
    const privateKeys = [allPrivateKeys[0]];

    const totalContacts = contacts.length;

    const { onClose } = rest;

    const handleSubmit = async (event: FormEvent) => {
        try {
            event.preventDefault();
            const requests = contacts.map(
                (contact) => () => updateContactPinnedKeys({ contact, api, publicKeys, privateKeys })
            );
            // the routes called in requests support 100 calls every 10 seconds
            await processApiRequestsSafe(requests, 100, 10 * 1000);
            onResolve();
        } catch (error: any) {
            createNotification({ text: error.message, type: 'error' });
            onError();
        } finally {
            onClose?.();
        }
    };
    const handleClose = () => {
        onNotTrust();
        onReject();
        onClose?.();
    };

    return (
        <ModalTwo
            size="large"
            as="form"
            {...rest}
            onClose={handleClose}
            onSubmit={(e: FormEvent) => withLoading(handleSubmit(e))}
        >
            <ModalTwoHeader title={c('Title').ngettext(msgid`Trust new key?`, `Trust new keys?`, contacts.length)} />
            <ModalTwoContent>
                {c('Key pinning').ngettext(
                    msgid`You have enabled Address Verification with Trusted Keys for this email address,
                        but no active encryption key has been trusted.
                        You must trust a key valid for sending in order to send a message to this email address.`,
                    `You have enabled Address Verification with Trusted Keys for these email addresses,
                        but no active encryption keys have been trusted.
                        You must trust keys valid for sending in order to send a message to these email addresses.`,
                    totalContacts
                )}
                <br />
                <Href href={getKnowledgeBaseUrl('/address-verification')}>{c('Link').t`Learn more`}</Href>
                <div>
                    {c('Key pinning').ngettext(
                        msgid`Do you want to trust the primary public key with the following fingerprint?`,
                        `Do you want to trust the primary public keys with the following fingerprints?`,
                        totalContacts
                    )}
                    <ul>
                        {contacts.map(({ contactID, emailAddress, bePinnedPublicKey }, index) => {
                            const fingerprint = bePinnedPublicKey.getFingerprint();
                            return (
                                <li key={contactID} className={clsx([index !== totalContacts && 'mb-2'])}>
                                    <span className="block max-w100 text-ellipsis">{`${emailAddress}: ${fingerprint}`}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleClose}>{c('Action').t`Close`}</Button>
                <PrimaryButton type="submit" loading={loading || loadingUserKeys}>
                    {c('Action').ngettext(msgid`Trust key`, `Trust keys`, totalContacts)}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AskForKeyPinningModal;
