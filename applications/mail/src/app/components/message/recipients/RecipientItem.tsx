import { useRef } from 'react';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import { PublicKeyReference } from '@proton/crypto';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { RecipientOrGroup } from '../../../models/address';
import RecipientItemLayout from './RecipientItemLayout';
import RecipientItemGroup from './RecipientItemGroup';
import MailRecipientItemSingle from './MailRecipientItemSingle';
import EORecipientSingle from '../../eo/message/recipients/EORecipientSingle';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message?: MessageState;
    recipientOrGroup: RecipientOrGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    isLoading: boolean;
    signingPublicKey?: PublicKeyReference;
    attachedPublicKey?: PublicKeyReference;
    isNarrow?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    hideAddress?: boolean;
    isRecipient?: boolean;
    isExpanded?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const RecipientItem = ({
    message,
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    isLoading,
    signingPublicKey,
    attachedPublicKey,
    isNarrow,
    showDropdown,
    isOutside = false,
    hideAddress,
    isRecipient,
    isExpanded,
    onContactDetails,
    onContactEdit,
}: Props) => {
    const ref = useRef<HTMLButtonElement>(null);

    if (isLoading) {
        return (
            <RecipientItemLayout dropdrownAnchorRef={ref} isLoading showDropdown={showDropdown} isOutside={isOutside} />
        );
    }

    if (recipientOrGroup.group) {
        return (
            <RecipientItemGroup
                group={recipientOrGroup.group}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                showDropdown={showDropdown}
            />
        );
    }

    if (recipientOrGroup.recipient) {
        if (!isOutside) {
            return (
                <MailRecipientItemSingle
                    message={message}
                    recipient={recipientOrGroup.recipient as Recipient}
                    mapStatusIcons={mapStatusIcons}
                    globalIcon={globalIcon}
                    signingPublicKey={signingPublicKey}
                    attachedPublicKey={attachedPublicKey}
                    isNarrow={isNarrow}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                    hideAddress={hideAddress}
                    isRecipient={isRecipient}
                    isExpanded={isExpanded}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                />
            );
        }
        return (
            <EORecipientSingle
                recipient={recipientOrGroup.recipient as Recipient}
                isRecipient={isRecipient}
                isExpanded={isExpanded}
            />
        );
    }

    // Undisclosed Recipient
    return (
        <RecipientItemLayout
            dropdrownAnchorRef={ref}
            label={c('Label').t`Undisclosed Recipients`}
            title={c('Label').t`Undisclosed Recipients`}
            showDropdown={showDropdown}
            isOutside={isOutside}
        />
    );
};

export default RecipientItem;
