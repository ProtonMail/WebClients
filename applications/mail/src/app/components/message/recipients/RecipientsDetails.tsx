import { c } from 'ttag';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import MailRecipientsList from './MailRecipientsList';
import { MessageState } from '../../../logic/messages/messagesTypes';
import EORecipientsList from '../../eo/message/recipients/EORecipientsList';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
    isOutside?: boolean;
}

const RecipientsDetails = ({
    message,
    mapStatusIcons,
    isLoading,
    highlightKeywords = false,
    isOutside = false,
}: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientType label={c('Label').t`To:`}>
                    {!isOutside ? (
                        <MailRecipientsList
                            list={ToList}
                            mapStatusIcons={mapStatusIcons}
                            isLoading={isLoading}
                            highlightKeywords={highlightKeywords}
                        />
                    ) : (
                        <EORecipientsList list={ToList} isLoading={isLoading} />
                    )}
                </RecipientType>
            )}
            {CCList.length > 0 && (
                <RecipientType label={c('Label').t`CC:`}>
                    {!isOutside ? (
                        <MailRecipientsList
                            list={CCList}
                            mapStatusIcons={mapStatusIcons}
                            isLoading={isLoading}
                            highlightKeywords={highlightKeywords}
                        />
                    ) : (
                        <EORecipientsList list={CCList} isLoading={isLoading} />
                    )}
                </RecipientType>
            )}
            {BCCList.length > 0 && (
                <RecipientType label={c('Label').t`BCC:`}>
                    {!isOutside ? (
                        <MailRecipientsList
                            list={BCCList}
                            mapStatusIcons={mapStatusIcons}
                            isLoading={isLoading}
                            highlightKeywords={highlightKeywords}
                        />
                    ) : (
                        <EORecipientsList list={BCCList} isLoading={isLoading} />
                    )}
                </RecipientType>
            )}
            {undisclosedRecipients && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientItem recipientOrGroup={{}} isLoading={isLoading} isOutside={isOutside} />
                </RecipientType>
            )}
        </div>
    );
};

export default RecipientsDetails;
