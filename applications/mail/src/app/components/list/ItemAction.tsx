import React from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';

import { Element } from '../../models/element';
import { isMessage } from '../../helpers/elements';
import { Message } from '../../models/message';

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
        <div className={className}>
            {!!message.IsReplied && <Icon name="reply" alt={c('Alt').t`Is replied`} />}
            {!!message.IsRepliedAll && <Icon name="reply-all" alt={c('Alt').t`Is replied to all`} />}
            {!!message.IsForwarded && <Icon name="reply" className="mirror" alt={c('Alt').t`Is transfered`} />}
        </div>
    );
};

export default ItemAction;
