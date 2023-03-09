import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { useExpiration } from '../../hooks/useExpiration';
import { MessageState } from '../../logic/messages/messagesTypes';

interface Props {
    onEditExpiration: () => void;
    message: MessageState;
}

const ComposerExpirationTime = ({ message, onEditExpiration }: Props) => {
    const { isExpiration, expireOnMessage } = useExpiration(message);
    const isExpiringDraft = !!message.draftFlags?.expiresIn;

    if (!isExpiration) {
        return null;
    }

    return (
        <div
            className={clsx([
                'rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 flex flex-align-items-center flex-gap-0-5 mb0-5',
                isExpiringDraft ? 'bg-info border-info' : 'bg-warning border-warning',
            ])}
            data-testid="expiration-banner"
        >
            <Icon name="hourglass" className="flex-item-noshrink myauto" />
            <span className="flex-item-fluid">{expireOnMessage}</span>
            <span className="on-mobile-w100 flex-item-noshrink flex-align-items-start flex">
                <Button
                    size="small"
                    shape="outline"
                    color={isExpiringDraft ? 'info' : 'warning'}
                    fullWidth
                    className="rounded-sm"
                    onClick={onEditExpiration}
                    data-testid="message:expiration-banner-edit-button"
                >{c('Action').t`Edit`}</Button>
            </span>
        </div>
    );
};

export default ComposerExpirationTime;
