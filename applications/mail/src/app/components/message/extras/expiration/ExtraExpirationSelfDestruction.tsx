import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Banner, Button, Tooltip } from '@proton/atoms';
import { Icon, useNotifications } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { canSetExpiration } from '../../../../helpers/expiration';
import useExpiration from '../../../../hooks/useExpiration';
import { expireMessages } from '../../../../store/messages/expire/messagesExpireActions';

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
        <Banner
            data-testid="expiration-banner"
            variant={expiresInLessThan24Hours ? 'danger' : 'info-outline'}
            icon={<Icon name="hourglass" />}
            action={
                canExpire ? (
                    <Tooltip title={c('Cancel expiration of the message').t`Cancel expiration`}>
                        <Button
                            onClick={handleClick}
                            color={expiresInLessThan24Hours ? 'danger' : 'weak'}
                            data-testid="unsubscribe-banner"
                        >
                            {c('Cancel expiration of the message').t`Cancel`}
                        </Button>
                    </Tooltip>
                ) : undefined
            }
        >
            {expirationMessage}
        </Banner>
    );
};

export default ExtraExpirationSelfDestruction;
