import { c } from 'ttag';

import type { ContactEditProps } from '@proton/components';

import type { MapStatusIcons } from '../../../models/crypto';
import type { MessageState } from '../../../store/messages/messagesTypes';
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

    const outputRecipientsDetails = (
        <>
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
                        <div className="mb-4 max-w-full" data-testid="recipients:to-list">
                            <div className="mb-2">
                                <strong className="mb-2">{c('Title').t`Recipients`}</strong>
                            </div>
                            {toRecipientsList}
                        </div>
                    )}
                    {CCList.length > 0 && (
                        <div className="mb-4 max-w-full" data-testid="recipients:cc-list">
                            <div className="mb-2">
                                <strong className="mb-2">{c('Title').t`CC`}</strong>
                            </div>
                            {ccRecipientsList}
                        </div>
                    )}
                    {BCCList.length > 0 && (
                        <div className="mb-4 max-w-full" data-testid="recipients:bcc-list">
                            <div className="mb-2">
                                <strong className="mb-2">{c('Title').t`BCC`}</strong>
                            </div>
                            {bccRecipientsList}
                        </div>
                    )}
                    {undisclosedRecipients && (
                        <div className="mb-4">
                            <div className="mb-2">
                                <strong className="mb-2">{c('Title').t`BCC`}</strong>
                            </div>
                            {undisclosedRecipientsItem}
                        </div>
                    )}
                </>
            )}
        </>
    );

    return isPrintModal ? (
        outputRecipientsDetails
    ) : (
        <div className="flex flex-column items-start flex-1">{outputRecipientsDetails}</div>
    );
};

export default RecipientsDetails;
