import React from 'react';
import { c } from 'ttag';

import { MessageExtended } from '../../../models/message';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import RecipientsList from './RecipientsList';

interface Props {
    message: MessageExtended;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
}

const RecipientsDetails = ({ message, mapStatusIcons, isLoading }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientsList list={ToList} mapStatusIcons={mapStatusIcons} isLoading={isLoading} />
                </RecipientType>
            )}
            {CCList.length > 0 && (
                <RecipientType label={c('Label').t`CC:`}>
                    <RecipientsList list={CCList} mapStatusIcons={mapStatusIcons} isLoading={isLoading} />
                </RecipientType>
            )}
            {BCCList.length > 0 && (
                <RecipientType label={c('Label').t`BCC:`}>
                    <RecipientsList list={BCCList} mapStatusIcons={mapStatusIcons} isLoading={isLoading} />
                </RecipientType>
            )}
            {undisclosedRecipients && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientItem recipientOrGroup={{}} isLoading={isLoading} />
                </RecipientType>
            )}
        </div>
    );
};

export default RecipientsDetails;
