import React from 'react';
import { c } from 'ttag';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces';

import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { RecipientOrGroup } from '../../../models/address';
import { OnCompose } from '../../../hooks/useCompose';
import HeaderRecipientItemLayout from './HeaderRecipientItemLayout';
import HeaderRecipientItemGroup from './HeaderRecipientItemGroup';
import HeaderRecipientItemRecipient from './HeaderRecipientItemRecipient';
import { Tooltip } from 'react-components';

interface Props {
    recipientOrGroup: RecipientOrGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    showLockIcon?: boolean;
    contacts: ContactEmail[];
    onCompose: OnCompose;
    isLoading: boolean;
}

const HeaderRecipientItem = ({
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    contacts,
    onCompose,
    isLoading
}: Props) => {
    if (isLoading) {
        return (
            <HeaderRecipientItemLayout
                isLoading
                button={
                    <span className="message-recipient-item-icon item-icon flex-item-noshrink rounded50 bl mr0-5"></span>
                }
                showAddress={showAddress}
            />
        );
    }

    if (recipientOrGroup.group) {
        return (
            <HeaderRecipientItemGroup
                group={recipientOrGroup.group}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                contacts={contacts}
                showAddress={showAddress}
                onCompose={onCompose}
            />
        );
    }

    if (recipientOrGroup.recipient) {
        return (
            <HeaderRecipientItemRecipient
                recipient={recipientOrGroup.recipient as Recipient}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                showAddress={showAddress}
                showLockIcon={showLockIcon}
                contacts={contacts}
                onCompose={onCompose}
            />
        );
    }

    // Undisclosed Recipient
    return (
        <HeaderRecipientItemLayout
            button={
                <Tooltip title={c('Title').t`All recipients were added to the BCC field and cannot be disclosed`}>
                    <span className="message-recipient-item-icon item-icon flex-item-noshrink rounded50 bl mr0-5 flex flex-justify-center flex-items-center">
                        ?
                    </span>
                </Tooltip>
            }
            label={c('Label').t`Undisclosed Recipients`}
        />
    );
};

export default HeaderRecipientItem;
