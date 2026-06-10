import { Banner } from '@proton/atoms/Banner/Banner';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcTrashClock } from '@proton/icons/icons/IcTrashClock';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import useExpiration from '../../../../../hooks/useExpiration';

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
            icon={autoDelete ? <IcTrashClock /> : <IcHourglass />}
        >
            {expirationMessage}
        </Banner>
    );
};

export default ExtraExpirationSentExpirationAutoDelete;
