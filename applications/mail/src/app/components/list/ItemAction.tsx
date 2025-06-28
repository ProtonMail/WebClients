import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import clsx from '@proton/utils/clsx';

import { isMessage } from '../../helpers/elements';
import type { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
}

const ItemAction = ({ element, className }: Props) => {
    if (!isMessage(element)) {
        return null;
    }

    const message = element as Message;

    if (!message.IsReplied && !message.IsRepliedAll && !message.IsForwarded) {
        return null;
    }

    return (
        <div className={clsx(['flex flex-nowrap', className])}>
            {!!message.IsReplied && (
                <Tooltip title={c('Alt').t`Replied to`}>
                    <Icon name="arrow-up-and-left-big" alt={c('Alt').t`Replied to`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!message.IsRepliedAll && (
                <Tooltip title={c('Alt').t`Replied to all`}>
                    <Icon name="arrows-up-and-left-big" alt={c('Alt').t`Replied to all`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!message.IsForwarded && (
                <Tooltip title={c('Alt').t`Forwarded`}>
                    <Icon name="arrow-up-and-left-big" alt={c('Alt').t`Forwarded`} className="mirror shrink-0 mr-1" />
                </Tooltip>
            )}
        </div>
    );
};

export default ItemAction;
