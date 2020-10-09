import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { Icon } from 'react-components';
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
        <div className={className}>
            {!!message.IsReplied && <Icon name="reply" alt={c('Alt').t`Replied to`} />}
            {!!message.IsRepliedAll && <Icon name="reply-all" alt={c('Alt').t`Replied to all`} />}
            {!!message.IsForwarded && <Icon name="reply" className="mirror" alt={c('Alt').t`Forwarded`} />}
        </div>
    );
};

export default ItemAction;
