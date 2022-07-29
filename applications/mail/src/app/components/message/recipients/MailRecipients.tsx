import { c } from 'ttag';

import { Button, Icon, classnames } from '@proton/components';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { RecipientOrGroup } from '../../../models/address';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientSimple from './RecipientSimple';
import RecipientsDetails from './RecipientsDetails';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    expanded: boolean;
    toggleDetails: () => void;
    recipientsOrGroup: RecipientOrGroup[];
    isOutside?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const MailRecipients = ({
    message,
    mapStatusIcons,
    isLoading,
    expanded,
    toggleDetails,
    recipientsOrGroup,
    isOutside,
    onContactDetails,
    onContactEdit,
}: Props) => {
    const titleAction = expanded ? c('Action').t`Hide details` : c('Action').t`Show details`;

    return (
        <div
            id="message-recipients"
            className={classnames([
                'flex flex-nowrap flex-item-fluid message-recipient',
                expanded && 'message-recipient-expanded',
            ])}
        >
            {expanded ? (
                <RecipientsDetails
                    message={message}
                    isLoading={isLoading}
                    mapStatusIcons={mapStatusIcons}
                    isOutside={isOutside}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                />
            ) : (
                <RecipientSimple
                    isLoading={isLoading}
                    recipientsOrGroup={recipientsOrGroup}
                    isOutside={isOutside}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                />
            )}
            {!isLoading && (
                <div className="flex-item-noshrink flex mlauto">
                    <Button
                        onClick={toggleDetails}
                        aria-expanded={expanded}
                        shape="ghost"
                        color="weak"
                        data-testid="message-show-details"
                        icon
                        className="mlauto mbauto message-header-expand-button"
                        title={titleAction}
                        size="small"
                        aria-controls="message-recipients" // hack to get proper styles AND proper vocalization
                    >
                        <Icon
                            name="chevron-down"
                            className={classnames(['navigation-icon--expand', expanded && 'rotateX-180'])}
                            alt={titleAction}
                        />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MailRecipients;
