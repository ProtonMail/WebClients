import React, { useMemo } from 'react';
import { Icon, Href, useModals, Alert } from 'react-components';
import { c } from 'ttag';
import ContactResignModal from '../modals/ContactResignModal';
import { MessageExtended } from '../../../models/message';
import { useContactCache } from '../../../containers/ContactProvider';
import { getContactEmail } from '../../../helpers/addresses';

interface Props {
    message: MessageExtended;
    onResignContact: () => void;
}

const ExtraAskResign = ({ message, onResignContact }: Props) => {
    const { senderVerified, senderPinnedKeys } = message;
    const { Address = '' } = message.data?.Sender || {};
    const { createModal } = useModals();
    const { contactsMap } = useContactCache();

    const contactEmail = useMemo(() => getContactEmail(contactsMap, Address), [contactsMap, Address]);

    if (senderVerified || !senderPinnedKeys?.length) {
        return null;
    }

    const handleClick = () => {
        if (!contactEmail) {
            return;
        }
        const contact = { contactID: contactEmail.ContactID };
        const senderName = message.data?.SenderName || ''; // No optional in translations

        createModal(
            <ContactResignModal
                title={c('Title').t`Trust pinned keys?`}
                submit={c('Action').t`Trust`}
                onResign={onResignContact}
                contacts={[contact]}
            >
                <Alert type="info">
                    {c('Info')
                        .t`When you enabled trusted keys for ${senderName}, the public keys were added to the contact details.`}
                </Alert>
                <Alert type="error">
                    {c('Info')
                        .t`There has been an error with the signature used to verify the contact details, which may be the result of a password reset.`}
                </Alert>
            </ContactResignModal>
        );
    };

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid flex-self-vcenter">
                <span className="mr0-25">{c('Info').t`We could not verify the sender's trusted keys.`}</span>
                <Href className="mr1 inbl" href="https://protonmail.com/support/knowledge-base/address-verification/">
                    {c('Info').t`Learn more`}
                </Href>
            </span>
            <button type="button" className="underline link" onClick={handleClick}>{c('Action').t`Verify`}</button>
        </div>
    );
};

export default ExtraAskResign;
