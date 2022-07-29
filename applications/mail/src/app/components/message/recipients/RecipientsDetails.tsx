import { c } from 'ttag';

import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { MapStatusIcons } from '../../../models/crypto';
import EORecipientsList from '../../eo/message/recipients/EORecipientsList';
import MailRecipientList from './MailRecipientList';
import RecipientItem from './RecipientItem';
import RecipientType from './RecipientType';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    isDetailsModal?: boolean;
    isPrintModal?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const RecipientsDetails = ({
    message,
    mapStatusIcons,
    isLoading,
    isDetailsModal = false,
    isPrintModal = false,
    showDropdown,
    isOutside,
    onContactDetails,
    onContactEdit,
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
                    showDropdown={showDropdown}
                    isPrintModal={isPrintModal}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
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
                    showDropdown={showDropdown}
                    isPrintModal={isPrintModal}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
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
                    showDropdown={showDropdown}
                    isPrintModal={isPrintModal}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
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
            isOutside={isOutside}
            onContactDetails={onContactDetails}
            onContactEdit={onContactEdit}
        />
    );

    return (
        <div className="flex flex-column flex-align-items-start flex-item-fluid">
            {!isDetailsModal ? (
                <>
                    {ToList.length > 0 && (
                        <RecipientType label={c('Label Recipient').t`To`}>{toRecipientsList}</RecipientType>
                    )}
                    {CCList.length > 0 && <RecipientType label={c('Label').t`CC`}>{ccRecipientsList}</RecipientType>}
                    {BCCList.length > 0 && <RecipientType label={c('Label').t`BCC`}>{bccRecipientsList}</RecipientType>}
                    {undisclosedRecipients && (
                        <RecipientType label={c('Label Recipient').t`To`}>{undisclosedRecipientsItem}</RecipientType>
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
