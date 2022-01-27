import { useMemo } from 'react';
import { Icon, Href, useModals, Alert } from '@proton/components';
import { c } from 'ttag';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import ContactResignModal from '../modals/ContactResignModal';
import { getContactEmail } from '../../../helpers/addresses';
import { MessageVerification } from '../../../logic/messages/messagesTypes';
import { useContactsMap } from '../../../hooks/contact/useContacts';

interface Props {
    message: Message | undefined;
    messageVerification: MessageVerification | undefined;
    onResignContact: () => void;
}

const ExtraAskResign = ({ message, messageVerification, onResignContact }: Props) => {
    const { senderVerified, senderPinnedKeys } = messageVerification || {};
    const { Address = '' } = message?.Sender || {};
    const { createModal } = useModals();
    const contactsMap = useContactsMap();

    const contactEmail = useMemo(() => getContactEmail(contactsMap, Address), [contactsMap, Address]);

    if (senderVerified || !senderPinnedKeys?.length) {
        return null;
    }

    const handleClick = () => {
        if (!contactEmail) {
            return;
        }
        const contact = { contactID: contactEmail.ContactID };
        const senderName = message?.SenderName || ''; // No optional in translations

        createModal(
            <ContactResignModal
                title={c('Title').t`Trust pinned keys?`}
                submit={c('Action').t`Trust`}
                onResign={onResignContact}
                contacts={[contact]}
            >
                <Alert className="mb1" type="info">
                    {c('Info')
                        .t`When you enabled trusted keys for ${senderName}, the public keys were added to the contact details.`}
                </Alert>
                <Alert className="mb1" type="error">
                    {c('Info')
                        .t`There has been an error with the signature used to verify the contact details, which may be the result of a password reset.`}
                </Alert>
            </ContactResignModal>
        );
    };

    return (
        <div className="bg-norm rounded border p0-5 mb0-5 flex flex-nowrap">
            <Icon name="triangle-exclamation" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid flex-align-self-center">
                <span className="mr0-25">{c('Info').t`We could not verify the sender's trusted keys.`}</span>
                <Href
                    className="mr1 inline-block"
                    href="https://protonmail.com/support/knowledge-base/address-verification/"
                >
                    {c('Info').t`Learn more`}
                </Href>
            </span>
            <button type="button" className="text-underline link" onClick={handleClick}>{c('Action').t`Verify`}</button>
        </div>
    );
};

export default ExtraAskResign;
