import { useRef } from 'react';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import { OpenPGPKey } from 'pmcrypto';

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
