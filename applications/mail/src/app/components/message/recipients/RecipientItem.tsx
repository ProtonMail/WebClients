import React from 'react';
import { c } from 'ttag';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces';
import { Tooltip } from 'react-components';
import { OpenPGPKey } from 'pmcrypto';

import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { RecipientOrGroup } from '../../../models/address';

import { OnCompose } from '../../../hooks/useCompose';
import RecipientItemLayout from './RecipientItemLayout';
import RecipientItemGroup from './RecipientItemGroup';
import RecipientItemSingle from './RecipientItemSingle';

interface Props {
    recipientOrGroup: RecipientOrGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    showLockIcon?: boolean;
    contacts: ContactEmail[];
    onCompose: OnCompose;
    isLoading: boolean;
    signingPublicKey?: OpenPGPKey;
}

const RecipientItem = ({
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    contacts,
    onCompose,
    isLoading,
    signingPublicKey,
}: Props) => {
    if (isLoading) {
        return (
            <RecipientItemLayout
                isLoading
                button={
                    <span className="message-recipient-item-icon item-icon flex-item-noshrink rounded50 bl mr0-5" />
                }
                showAddress={showAddress}
            />
        );
    }

    if (recipientOrGroup.group) {
        return (
            <RecipientItemGroup
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
            <RecipientItemSingle
                recipient={recipientOrGroup.recipient as Recipient}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                showAddress={showAddress}
                showLockIcon={showLockIcon}
                contacts={contacts}
                onCompose={onCompose}
                signingPublicKey={signingPublicKey}
            />
        );
    }

    // Undisclosed Recipient
    return (
        <RecipientItemLayout
            button={
                <Tooltip title={c('Title').t`All recipients were added to the BCC field and cannot be disclosed`}>
                    <span className="message-recipient-item-icon item-icon flex-item-noshrink rounded50 bl mr0-5 flex flex-justify-center flex-items-center">
                        ?
                    </span>
                </Tooltip>
            }
            label={c('Label').t`Undisclosed Recipients`}
            title={c('Label').t`Undisclosed Recipients`}
        />
    );
};

export default RecipientItem;
