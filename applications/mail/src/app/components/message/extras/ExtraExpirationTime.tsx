import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip, useApi, useEventManager, useNotifications, useUser } from '@proton/components';

import { useExpiration } from '../../../hooks/useExpiration';
import { expireMessages } from '../../../logic/messages/expire/messagesExpireActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../../logic/store';

interface Props {
    message: MessageState;
}

const ExtraExpirationTime = ({ message }: Props) => {
    const [user] = useUser();
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();
    const { isExpiration, delayMessage } = useExpiration(message);

    if (!isExpiration) {
        return null;
    }

    const handleClick = () => {
        if (user.isFree) {
            return;
        }
        void dispatch(expireMessages({ IDs: [message.localID], expirationTime: null, api, call }));
        createNotification({ text: c('Success').t`Self-destruction cancelled` });
    };

    return (
        <div className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5" data-testid="expiration-banner">
                <Icon name="hourglass" className="mt0-4 flex-item-noshrink ml0-2" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid flex-align-items-center">{delayMessage}</span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Tooltip title={c('Cancel self-destruction of the message').t`Cancel self-destruction`}>
                    <Button
                        onClick={handleClick}
                        size="small"
                        color="weak"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        data-testid="unsubscribe-banner"
                        disabled={user.isFree}
                    >
                        {c('Cancel self-destruction of the message').t`Cancel`}
                    </Button>
                </Tooltip>
            </span>
        </div>
    );
};

export default ExtraExpirationTime;
