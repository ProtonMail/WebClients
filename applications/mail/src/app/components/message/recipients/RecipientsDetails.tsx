import { c } from 'ttag';
import { HighlightMetadata } from '@proton/encrypted-search';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import { MessageState } from '../../../logic/messages/messagesTypes';
import EORecipientsList from '../../eo/message/recipients/EORecipientsList';
import MailRecipientList from './MailRecipientList';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    isDetailsModal?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const RecipientsDetails = ({
    message,
    mapStatusIcons,
    isLoading,
    highlightKeywords = false,
    highlightMetadata,
    isDetailsModal = false,
    showDropdown,
    isOutside,
}: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

    const toRecipientsList = (
        <>
            {!isOutside ? (
                <MailRecipientList
                    list={ToList}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                    highlightMetadata={highlightMetadata}
                    showDropdown={showDropdown}
                />
            ) : (
                <EORecipientsList list={ToList} isLoading={isLoading} showDropdown={showDropdown} />
            )}
        </>
    );

    const ccRecipientsList = (
        <>
            {!isOutside ? (
                <MailRecipientList
                    list={CCList}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                    highlightMetadata={highlightMetadata}
                    showDropdown={showDropdown}
                />
            ) : (
                <EORecipientsList list={CCList} isLoading={isLoading} showDropdown={showDropdown} />
            )}
        </>
    );

    const bccRecipientsList = (
        <>
            {!isOutside ? (
                <MailRecipientList
                    list={BCCList}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                    highlightMetadata={highlightMetadata}
                    showDropdown={showDropdown}
                />
            ) : (
                <EORecipientsList list={BCCList} isLoading={isLoading} showDropdown={showDropdown} />
            )}
        </>
    );

    const undisclosedRecipientsItem = (
        <RecipientItem
            recipientOrGroup={{}}
            isLoading={isLoading}
            showDropdown={showDropdown}
            highlightMetadata={highlightMetadata}
            isOutside={isOutside}
        />
    );

    return (
        <div className="flex flex-column flex-align-items-start flex-item-fluid">
            {!isDetailsModal ? (
                <>
                    {ToList.length > 0 && <RecipientType label={c('Label').t`To`}>{toRecipientsList}</RecipientType>}
                    {CCList.length > 0 && <RecipientType label={c('Label').t`CC`}>{ccRecipientsList}</RecipientType>}
                    {BCCList.length > 0 && <RecipientType label={c('Label').t`BCC`}>{bccRecipientsList}</RecipientType>}
                    {undisclosedRecipients && (
                        <RecipientType label={c('Label').t`To`}>{undisclosedRecipientsItem}</RecipientType>
                    )}
                </>
            ) : (
                <>
                    {ToList.length > 0 && (
                        <div className="mb1">
                            <div className="mb0-5">
                                <strong className="mb0-5">{c('Title').t`Recipients`}</strong>
                            </div>
                            {toRecipientsList}
                        </div>
                    )}
                    {CCList.length > 0 && (
                        <div className="mb1">
                            <div className="mb0-5">
                                <strong className="mb0-5">{c('Title').t`CC`}</strong>
                            </div>
                            {ccRecipientsList}
                        </div>
                    )}
                    {BCCList.length > 0 && (
                        <div className="mb1">
                            <div className="mb0-5">
                                <strong className="mb0-5">{c('Title').t`BCC`}</strong>
                            </div>
                            {bccRecipientsList}
                        </div>
                    )}
                    {undisclosedRecipients && (
                        <div className="mb1">
                            <div className="mb0-5">
                                <strong className="mb0-5">{c('Title').t`BCC`}</strong>
                            </div>
                            {undisclosedRecipientsItem}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecipientsDetails;
