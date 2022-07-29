import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, Href, Icon, useModalState } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { getContactEmail } from '../../../helpers/addresses';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { MessageVerification } from '../../../logic/messages/messagesTypes';
import ContactResignModal from '../modals/ContactResignModal';

interface Props {
    message: Message | undefined;
    messageVerification: MessageVerification | undefined;
    onResignContact: () => void;
}

const ExtraAskResign = ({ message, messageVerification, onResignContact }: Props) => {
    const { senderVerified, senderPinnedKeys } = messageVerification || {};
    const { Address = '' } = message?.Sender || {};
    const contactsMap = useContactsMap();

    const [contactID, setContactID] = useState<string>('');

    const [contactResignModalProps, setContactResignModalOpen, render] = useModalState();

    const contactEmail = useMemo(() => getContactEmail(contactsMap, Address), [contactsMap, Address]);

    const senderName = message?.Sender?.Name || message?.Sender?.Address; // No optional in translations

    if (senderVerified || !senderPinnedKeys?.length) {
        return null;
    }

    const handleClick = () => {
        if (!contactEmail) {
            return;
        }

        setContactID(contactEmail.ContactID);

        setContactResignModalOpen(true);
    };

    return (
        <div
            className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column"
            data-testid="extra-ask-resign:banner"
        >
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink ml0-2 mt0-4 color-danger" />
                <span className="pl0-5 pr0-5 mt0 flex-item-fluid flex-align-self-center">
                    <span className="mr0-25">{c('Info').t`We could not verify the sender's trusted keys.`}</span>
                    <Href className="mr1 inline-block" href={getKnowledgeBaseUrl('/address-verification')}>
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100">
                <Button
                    size="small"
                    color="weak"
                    shape="outline"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleClick}
                >{c('Action').t`Verify`}</Button>
            </span>

            {render && (
                <ContactResignModal
                    title={c('Title').t`Trust pinned keys?`}
                    submit={c('Action').t`Trust`}
                    onResign={onResignContact}
                    contacts={[{ contactID }]}
                    {...contactResignModalProps}
                >
                    {c('Info')
                        .t`When you enabled trusted keys for ${senderName}, the public keys were added to the contact details.`}
                    <br />
                    {c('Info')
                        .t`There has been an error with the signature used to verify the contact details, which may be the result of a password reset.`}
                </ContactResignModal>
            )}
        </div>
    );
};

export default ExtraAskResign;
