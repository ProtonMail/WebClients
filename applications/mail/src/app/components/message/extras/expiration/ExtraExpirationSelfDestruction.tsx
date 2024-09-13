import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FeatureCode, Icon, Tooltip, useFeature, useNotifications, useUser } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { canSetExpiration } from '../../../../helpers/expiration';
import useExpiration from '../../../../hooks/useExpiration';
import { expireMessages } from '../../../../store/messages/expire/messagesExpireActions';
import type { MessageState } from '../../../../store/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraExpirationSelfDestruction = ({ message }: Props) => {
    const { expirationMessage, expiresInLessThan24Hours } = useExpiration(message);

    const [user] = useUser();
    const { createNotification } = useNotifications();
    const { feature } = useFeature(FeatureCode.SetExpiration);

    const dispatch = useMailDispatch();
    const canExpire = canSetExpiration(feature?.Value, user, message);

    const messageID = message.data?.ID || '';
    const conversationID = message.data?.ConversationID;

    const handleClick = () => {
        if (user.isFree) {
            return;
        }
        void dispatch(
            expireMessages({
                IDs: [messageID],
                conversationID,
                expirationTime: null,
            })
        );
        createNotification({ text: c('Success').t`Message expiration canceled` });
    };

    return (
        <div
            className={clsx(
                'bg-norm rounded border flex items-center py-2 px-2 mb-2 gap-4',
                expiresInLessThan24Hours && 'color-danger border-danger'
            )}
            data-testid="expiration-banner"
        >
            <Icon name="hourglass" className="shrink-0" />
            <span className="flex flex-1 items-center">{expirationMessage}</span>
            {canExpire && (
                <span className="shrink-0 w-full md:w-auto">
                    <Tooltip title={c('Cancel expiration of the message').t`Cancel expiration`}>
                        <Button
                            onClick={handleClick}
                            size="small"
                            color={expiresInLessThan24Hours ? 'danger' : 'weak'}
                            shape="underline"
                            data-testid="unsubscribe-banner"
                        >
                            {c('Cancel expiration of the message').t`Cancel`}
                        </Button>
                    </Tooltip>
                </span>
            )}
        </div>
    );
};

export default ExtraExpirationSelfDestruction;
