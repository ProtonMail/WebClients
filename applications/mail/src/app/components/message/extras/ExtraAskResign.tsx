import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { getContactEmail } from '../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { MessageVerification, MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';
import ContactResignModal from '../modals/ContactResignModal';

interface Props {
    message: MessageWithOptionalBody;
    messageVerification: MessageVerification | undefined;
    onResignContact: () => void;
}

const ExtraAskResign = ({ message, messageVerification, onResignContact }: Props) => {
    const { pinnedKeysVerified, senderPinnedKeys } = messageVerification || {};
    const { Address = '' } = message.Sender || {};
    const contactsMap = useContactsMap();

    const [contactID, setContactID] = useState<string>('');

    const [contactResignModalProps, setContactResignModalOpen, render] = useModalState();

    const contactEmail = useMemo(() => getContactEmail(contactsMap, Address), [contactsMap, Address]);

    const senderName = message?.Sender?.Name || message?.Sender?.Address; // No optional in translations

    if (pinnedKeysVerified || !senderPinnedKeys?.length) {
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
            className="bg-norm rounded border py-1 pr-2 pb-2 md:pr-1 md:pb-0 pl-2 mb-3 flex flex-nowrap on-mobile-flex-column"
            data-testid="extra-ask-resign:banner"
        >
            <div className="flex-item-fluid flex flex-nowrap mb-2 md:mb-0">
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink ml-0.5 mt-1 color-danger" />
                <span className="px-2 mt-0 flex-item-fluid flex-align-self-center">
                    <span className="mr-1">{c('Info').t`We could not verify the sender's trusted keys.`}</span>
                    <Href className="mr-4 inline-block" href={getKnowledgeBaseUrl('/address-verification')}>
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
                    data-testid="ask-resign-banner:verify-button"
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
