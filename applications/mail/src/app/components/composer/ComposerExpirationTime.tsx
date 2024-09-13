import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { getExpiresOnMessage } from '../../helpers/message/messageExpirationTime';
import type { MessageState } from '../../store/messages/messagesTypes';

interface Props {
    onEditExpiration: () => void;
    message: MessageState;
}

const ComposerExpirationTime = ({ message, onEditExpiration }: Props) => {
    const expirationDate = message.draftFlags?.expiresIn;

    if (!expirationDate) {
        return null;
    }

    const expireOnMessage = getExpiresOnMessage(expirationDate);

    return (
        <div
            className={clsx([
                'rounded border pr-1 pb-1 md:pl-2 md:pr-1 md:py-1 flex items-center gap-2 my-2',
                expirationDate ? 'bg-info border-info' : 'bg-warning border-warning',
            ])}
            data-testid="expiration-banner"
        >
            <Icon name="hourglass" className="shrink-0 my-auto" />
            <span className="flex-1">{expireOnMessage}</span>
            <span className="w-full md:w-auto shrink-0 items-start flex">
                <Button
                    size="small"
                    shape="outline"
                    color={expirationDate ? 'info' : 'warning'}
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
