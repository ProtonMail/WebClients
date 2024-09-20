import { useRef } from 'react';

import { c } from 'ttag';

import type { ContactEditProps } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import type { Recipient } from '@proton/shared/lib/interfaces';

import type { RecipientOrGroup } from '../../../models/address';
import type { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import type { MessageState } from '../../../store/messages/messagesTypes';
import EORecipientSingle from '../../eo/message/recipients/EORecipientSingle';
import MailRecipientItemSingle from './MailRecipientItemSingle';
import RecipientItemGroup from './RecipientItemGroup';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    message?: MessageState;
    recipientOrGroup: RecipientOrGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    isLoading: boolean;
    signingPublicKey?: PublicKeyReference;
    attachedPublicKey?: PublicKeyReference;
    isSmallViewport?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    hideAddress?: boolean;
    isRecipient?: boolean;
    isExpanded?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
    customDataTestId?: string;
    hasHeading?: boolean;
}

const RecipientItem = ({
    message,
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    isLoading,
    signingPublicKey,
    attachedPublicKey,
    isSmallViewport,
    showDropdown,
    isOutside = false,
    hideAddress,
    isRecipient,
    isExpanded,
    onContactDetails,
    onContactEdit,
    customDataTestId,
    hasHeading = false,
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
                customDataTestId={customDataTestId}
                hasHeading={hasHeading}
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
                    isSmallViewport={isSmallViewport}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                    hideAddress={hideAddress}
                    isRecipient={isRecipient}
                    isExpanded={isExpanded}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                    customDataTestId={customDataTestId}
                    hasHeading={hasHeading}
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
            hasHeading={hasHeading}
        />
    );
};

export default RecipientItem;
