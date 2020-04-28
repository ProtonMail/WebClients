import { Button, Icon, LearnMore, useContactEmails, useModals } from 'react-components';
import { ContactEmail, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import React, { useMemo } from 'react';
import { c } from 'ttag';

import { VERIFICATION_STATUS } from '../../../constants';
import { MessageExtended } from '../../../models/message';

import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';

const { SIGNED_AND_INVALID } = VERIFICATION_STATUS;

interface Props {
    message: MessageExtended;
    onTrustKey: () => void;
}

const ExtraPinSigningKey = ({ message, onTrustKey }: Props) => {
    const { createModal } = useModals();
    const [contacts = [], loadingContacts] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];

    const emailAddress = message.data?.Sender?.Address;
    const messageContactID = message.data?.Sender?.ContactID;
    const bePinnedPublicKey = message.signingPublicKey;
    const promptKeyPinning =
        message.verificationStatus === SIGNED_AND_INVALID && !!message.senderPinnedKeys?.length && !!bePinnedPublicKey;
    const contactID = useMemo<string | undefined>(() => {
        if (messageContactID) {
            return messageContactID;
        }
        const preferredContact = contacts.find(({ Email }) => Email === emailAddress);
        return preferredContact?.ContactID;
    }, [messageContactID, contacts, emailAddress]);

    if (!promptKeyPinning) {
        return null;
    }
    const loading = loadingContacts || !emailAddress || !contactID;

    const handleTrustKey = () => {
        if (loading) {
            return;
        }
        const contact = { emailAddress, contactID, bePinnedPublicKey } as ContactWithBePinnedPublicKey;
        return createModal(<TrustPublicKeyModal contact={contact} onSubmit={onTrustKey} />);
    };

    return (
        <div className="rounded bordered-container p0-5 mb0-5 flex flex-nowrap flex-items-center flex-spacebetween bg-global-attention">
            {<Icon name="key" className="mtauto mbauto mr0-5" />}
            <div className="flex">
                <div className="mr0-5">
                    {c('Info').t`This message is signed by a public key that has not been trusted yet. `}
                    <LearnMore url="https://protonmail.com/support/knowledge-base/address-verification/" />
                </div>
            </div>
            <span className="flex-items-center">
                <Button onClick={handleTrustKey} disabled={loading}>
                    {c('Action').t`Trust key`}
                </Button>
            </span>
        </div>
    );
};

export default ExtraPinSigningKey;
