import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Banner, Button, Href } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import type { MessageVerification, MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import { getContactEmail } from '../../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../../hooks/contact/useContacts';
import ContactResignModal from '../../modals/ContactResignModal';

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
        <Banner
            data-testid="extra-ask-resign:banner"
            variant="norm-outline"
            icon={<Icon name="exclamation-triangle-filled" className="color-danger" />}
            link={
                <Href className="inline-block" href={getKnowledgeBaseUrl('/address-verification')}>
                    {c('Info').t`Learn more`}
                </Href>
            }
            action={
                <Button onClick={handleClick} data-testid="ask-resign-banner:verify-button">{c('Action')
                    .t`Verify`}</Button>
            }
        >
            {c('Info').t`We could not verify the sender's trusted keys.`}

            {render && (
                <ContactResignModal
                    title={c('Title').t`Trust pinned keys?`}
                    submit={c('Action').t`Trust`}
                    onResign={onResignContact}
                    contacts={[{ contactID }]}
                    onResolve={noop}
                    onReject={noop}
                    {...contactResignModalProps}
                >
                    {c('Info')
                        .t`When you enabled trusted keys for ${senderName}, the public keys were added to the contact details.`}
                    <br />
                    {c('Info')
                        .t`There has been an error with the signature used to verify the contact details, which may be the result of a password reset.`}
                </ContactResignModal>
            )}
        </Banner>
    );
};

export default ExtraAskResign;
