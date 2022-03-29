import { c } from 'ttag';

import { classnames, Icon, Button } from '@proton/components';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientsDetails from './RecipientsDetails';
import RecipientSimple from './RecipientSimple';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    message: MessageState;
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    expanded: boolean;
    toggleDetails: () => void;
    recipientsOrGroup: RecipientOrGroup[];
    isOutside?: boolean;
}

const MailRecipients = ({
    message,
    mapStatusIcons,
    isLoading,
    expanded,
    toggleDetails,
    recipientsOrGroup,
    isOutside,
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
                />
            ) : (
                <RecipientSimple isLoading={isLoading} recipientsOrGroup={recipientsOrGroup} isOutside={isOutside} />
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
                        square
                        aria-controls="message-recipients" // hack to get proper styles AND proper vocalization
                    >
                        <Icon
                            name="angle-down"
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
