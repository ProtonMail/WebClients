import { Icon, IconName, Tooltip, useMailSettings } from '@proton/components';
import { isFrozenExpiration } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { isAllowedAutoDeleteLabelID } from '../../../helpers/autoDelete';
import { isConversation, isMessage } from '../../../helpers/elements';
import { Element } from '../../../models/element';
import useItemExpiration from './useItemExpiration';

import './ItemExpiration.scss';

interface Props {
    className?: string;
    expirationTime?: number;
    element: Element;
    labelID: string;
}

const ItemExpiration = ({ className, expirationTime, element, labelID }: Props) => {
    const { tooltipMessage, shortMessage, expiresInLessThan24Hours } = useItemExpiration(expirationTime);
    const [mailSettings] = useMailSettings();

    if (!expirationTime) {
        return null;
    }

    const iconName: Extract<IconName, 'hourglass' | 'trash-clock'> = (() => {
        if (
            isAllowedAutoDeleteLabelID(labelID) &&
            ((isMessage(element) && !isFrozenExpiration(element)) ||
                (isConversation(element) && mailSettings?.AutoDeleteSpamAndTrashDays !== null))
        ) {
            return 'trash-clock';
        }

        return 'hourglass';
    })();

    return (
        <Tooltip title={tooltipMessage}>
            <div
                className={clsx([
                    'pill-icon flex flex-align-items-center flex-nowrap',
                    className,
                    expiresInLessThan24Hours && 'color-danger',
                ])}
                data-testid="item-expiration"
            >
                <Icon name={iconName} className="flex-item-noshrink" size={14} alt={tooltipMessage} />
                <span className="ml0-25 text-sm text-nowrap">{shortMessage}</span>
            </div>
        </Tooltip>
    );
};

export default ItemExpiration;
