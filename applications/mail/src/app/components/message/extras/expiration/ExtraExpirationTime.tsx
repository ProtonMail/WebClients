import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FeatureCode, Icon, Tooltip, useFeature, useNotifications, useUser } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { canSetExpiration } from '../../../../helpers/expiration';
import useExpiration from '../../../../hooks/useExpiration';
import { expireMessages } from '../../../../logic/messages/expire/messagesExpireActions';
import { MessageState } from '../../../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../../../logic/store';

interface Props {
    message: MessageState;
}

const ExtraExpirationTime = ({ message }: Props) => {
    const { expirationMessage, expiresInLessThan24Hours, expirationDate } = useExpiration(message);

    const [user] = useUser();
    const { createNotification } = useNotifications();
    const { feature } = useFeature(FeatureCode.SetExpiration);

    const dispatch = useAppDispatch();

    const canExpire = canSetExpiration(feature?.Value, user, message);

    const messageID = message.data?.ID || '';
    const conversationID = message.data?.ConversationID;

    if (!expirationDate) {
        return null;
    }

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
        createNotification({ text: c('Success').t`Message expiration cancelled` });
    };

    return (
        <div
            className={clsx(
                'bg-norm rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap flex-column md:flex-row',
                expiresInLessThan24Hours && 'color-danger border-danger'
            )}
        >
            <div className="flex-item-fluid flex flex-nowrap mb-2 md:mb-0" data-testid="expiration-banner">
                <Icon name="hourglass" className="mt-1 ml-0.5 flex-item-noshrink" />
                <span className={clsx(!canExpire && 'mt-1', 'px-2 flex flex-item-fluid flex-align-items-center')}>
                    {expirationMessage}
                </span>
            </div>
            {canExpire ? (
                <span className="flex-item-noshrink flex-align-items-start flex w-full md:w-auto pt-0.5">
                    <Tooltip title={c('Cancel expiration of the message').t`Cancel expiration`}>
                        <Button
                            onClick={handleClick}
                            size="small"
                            color="weak"
                            shape="outline"
                            fullWidth
                            className="rounded-sm"
                            data-testid="unsubscribe-banner"
                        >
                            {c('Cancel expiration of the message').t`Cancel`}
                        </Button>
                    </Tooltip>
                </span>
            ) : null}
        </div>
    );
};

export default ExtraExpirationTime;
