import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { ContactEditProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { RecipientOrGroup } from '../../../models/address';
import type { MapStatusIcons } from '../../../models/crypto';
import type { MessageState } from '../../../store/messages/messagesTypes';
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
            className={clsx(['flex flex-nowrap flex-1 message-recipient', expanded && 'message-recipient-expanded'])}
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
                <div className="shrink-0 flex ml-auto">
                    <Button
                        onClick={toggleDetails}
                        aria-expanded={expanded}
                        shape="ghost"
                        color="weak"
                        data-testid="message-show-details"
                        icon
                        className="ml-auto mb-auto message-header-expand-button"
                        title={titleAction}
                        size="small"
                        aria-controls="message-recipients" // hack to get proper styles AND proper vocalization
                    >
                        <Icon
                            name="chevron-down"
                            className={clsx(['navigation-icon--expand', expanded && 'rotateX-180'])}
                            alt={titleAction}
                        />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MailRecipients;
