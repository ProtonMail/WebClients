import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useExpiration from '../../../../hooks/useExpiration';
import { MessageState } from '../../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
    autoDelete?: boolean;
}

const ExtraExpirationSentExpirationAutoDelete = ({ message, autoDelete }: Props) => {
    const { expirationMessage, expiresInLessThan24Hours } = useExpiration(message, autoDelete);

    return (
        <div
            className={clsx(
                'bg-norm rounded border flex items-center py-2 px-2 mb-2 gap-4',
                expiresInLessThan24Hours && 'color-danger border-danger'
            )}
            data-testid="expiration-banner"
        >
            <Icon name={autoDelete ? 'trash-clock' : 'hourglass'} className="flex-item-noshrink" />
            <span className="flex flex-item-fluid items-center">{expirationMessage}</span>
        </div>
    );
};

export default ExtraExpirationSentExpirationAutoDelete;
