import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { classnames, Icon, Tooltip } from 'react-components';
import { c } from 'ttag';

import { Element } from '../../models/element';
import { isMessage } from '../../helpers/elements';

interface Props {
    element?: Element;
    className?: string;
}

const ItemAction = ({ element = {}, className }: Props) => {
    if (!isMessage(element)) {
        return null;
    }

    const message = element as Message;

    if (!message.IsReplied && !message.IsRepliedAll && !message.IsForwarded) {
        return null;
    }

    return (
        <div className={classnames(['flex flex-nowrap', className])}>
            {!!message.IsReplied && (
                <Tooltip title={c('Alt').t`Replied to`}>
                    <Icon name="reply" alt={c('Alt').t`Replied to`} className="flex-item-noshrink mr0-5" />
                </Tooltip>
            )}
            {!!message.IsRepliedAll && (
                <Tooltip title={c('Alt').t`Replied to all`}>
                    <Icon name="reply-all" alt={c('Alt').t`Replied to all`} className="flex-item-noshrink mr0-5" />
                </Tooltip>
            )}
            {!!message.IsForwarded && (
                <Tooltip title={c('Alt').t`Forwarded`}>
                    <Icon name="reply" alt={c('Alt').t`Forwarded`} className="mirror flex-item-noshrink mr0-5" />
                </Tooltip>
            )}
        </div>
    );
};

export default ItemAction;
