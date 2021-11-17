import { Icon } from '@proton/components';

import { Element } from '../../../models/element';
import { MessageExtended } from '../../../models/message';
import { useExpiration } from '../../../hooks/useExpiration';

interface Props {
    message: MessageExtended;
}

const ExtraExpirationTime = ({ message }: Props) => {
    const [isExpiration, delayMessage] = useExpiration(message.data || ({} as Element));

    if (!isExpiration) {
        return null;
    }

    return (
        <div className="bg-warning rounded p0-5 mb0-5 flex flex-nowrap" data-testid="expiration-banner">
            <Icon name="hourglass-empty" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{delayMessage}</span>
        </div>
    );
};

export default ExtraExpirationTime;
