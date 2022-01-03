import { useRef } from 'react';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import { OpenPGPKey } from 'pmcrypto';

import { HighlightMetadata } from '@proton/encrypted-search';
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
    showAddress?: boolean;
    showLockIcon?: boolean;
    isLoading: boolean;
    signingPublicKey?: OpenPGPKey;
    attachedPublicKey?: OpenPGPKey;
    isNarrow?: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const RecipientItem = ({
    message,
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    isLoading,
    signingPublicKey,
    attachedPublicKey,
    isNarrow,
    highlightKeywords = false,
    highlightMetadata,
    showDropdown,
    isOutside = false,
}: Props) => {
    const ref = useRef<HTMLButtonElement>(null);

    if (isLoading) {
        return (
            <RecipientItemLayout
                dropdrownAnchorRef={ref}
                isLoading
                showAddress={showAddress}
                showDropdown={showDropdown}
                highlightMetadata={highlightMetadata}
                isOutside={isOutside}
            />
        );
    }

    if (recipientOrGroup.group) {
        return (
            <RecipientItemGroup
                group={recipientOrGroup.group}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                highlightKeywords={highlightKeywords}
                highlightMetadata={highlightMetadata}
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
                    showAddress={showAddress}
                    showLockIcon={showLockIcon}
                    signingPublicKey={signingPublicKey}
                    attachedPublicKey={attachedPublicKey}
                    isNarrow={isNarrow}
                    highlightKeywords={highlightKeywords}
                    highlightMetadata={highlightMetadata}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                />
            );
        }
        return <EORecipientSingle recipient={recipientOrGroup.recipient as Recipient} showAddress={showAddress} />;
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
