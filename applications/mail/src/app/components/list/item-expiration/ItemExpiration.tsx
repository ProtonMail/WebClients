import { Tooltip } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { isFrozenExpiration } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { isAllowedAutoDeleteLabelID } from '../../../helpers/autoDelete';
import { isElementConversation, isElementMessage } from '../../../helpers/elements';
import type { Element } from '../../../models/element';
import useItemExpiration from './useItemExpiration';

import './ItemExpiration.scss';

interface Props {
    className?: string;
    expirationTime?: number;
    element: Element;
    labelID: string;
}

const ItemExpiration = ({ className, expirationTime, element, labelID }: Props) => {
    const { tooltipMessage, shortMessage, expiresInLessThan24Hours } = useItemExpiration(element, expirationTime);
    const mailSettings = useMailModel('MailSettings');

    if (!expirationTime) {
        return null;
    }

    const iconName: Extract<IconName, 'hourglass' | 'trash-clock'> = (() => {
        if (
            isAllowedAutoDeleteLabelID(labelID) &&
            ((isElementMessage(element) && !isFrozenExpiration(element)) ||
                (isElementConversation(element) && mailSettings.AutoDeleteSpamAndTrashDays !== null))
        ) {
            return 'trash-clock';
        }

        return 'hourglass';
    })();

    return (
        <Tooltip title={tooltipMessage}>
            <div
                className={clsx([
                    'pill-icon flex items-center flex-nowrap',
                    className,
                    expiresInLessThan24Hours && 'color-danger',
                ])}
                data-testid="item-expiration"
            >
                <Icon name={iconName} className="shrink-0" size={3.5} alt={tooltipMessage} />
                <span className="ml-1 text-sm text-nowrap">{shortMessage}</span>
            </div>
        </Tooltip>
    );
};

export default ItemExpiration;
