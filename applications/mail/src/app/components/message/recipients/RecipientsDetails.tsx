import { c } from 'ttag';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import RecipientsList from './RecipientsList';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
}

const RecipientsDetails = ({ message, mapStatusIcons, isLoading, highlightKeywords = false }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientsList
                        list={ToList}
                        mapStatusIcons={mapStatusIcons}
                        isLoading={isLoading}
                        highlightKeywords={highlightKeywords}
                    />
                </RecipientType>
            )}
            {CCList.length > 0 && (
                <RecipientType label={c('Label').t`CC:`}>
                    <RecipientsList
                        list={CCList}
                        mapStatusIcons={mapStatusIcons}
                        isLoading={isLoading}
                        highlightKeywords={highlightKeywords}
                    />
                </RecipientType>
            )}
            {BCCList.length > 0 && (
                <RecipientType label={c('Label').t`BCC:`}>
                    <RecipientsList
                        list={BCCList}
                        mapStatusIcons={mapStatusIcons}
                        isLoading={isLoading}
                        highlightKeywords={highlightKeywords}
                    />
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
