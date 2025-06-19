import { Banner } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import useExpiration from '../../../../hooks/useExpiration';

interface Props {
    message: MessageState;
    autoDelete?: boolean;
}

const ExtraExpirationSentExpirationAutoDelete = ({ message, autoDelete }: Props) => {
    const { expirationMessage, expiresInLessThan24Hours } = useExpiration(message, autoDelete);

    return (
        <Banner
            data-testid="expiration-banner"
            variant={expiresInLessThan24Hours ? 'danger' : 'info-outline'}
            icon={<Icon name={autoDelete ? 'trash-clock' : 'hourglass'} />}
        >
            {expirationMessage}
        </Banner>
    );
};

export default ExtraExpirationSentExpirationAutoDelete;
