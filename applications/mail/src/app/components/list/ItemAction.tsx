import React from 'react';
import { Icon, classnames } from 'react-components';
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

    const icon = message.IsReplied
        ? 'reply'
        : message.IsRepliedAll
        ? 'reply-all'
        : message.IsForwarded
        ? 'reply'
        : undefined;

    const alt = message.IsReplied
        ? c('Alt').t`Is replied`
        : message.IsRepliedAll
        ? c('Alt').t`Is replied to all`
        : message.IsForwarded
        ? c('Alt').t`Is transfered`
        : undefined;

    const classNameToAdd = message.IsForwarded ? 'mirror' : undefined;

    if (!icon) {
        return null;
    }

    return <Icon name={icon} className={classnames([className, classNameToAdd])} alt={alt} />;
};

export default ItemAction;
