import React from 'react';
import { Icon, classnames } from 'react-components';

import { hasAttachments } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
}

const ItemAttachmentIcon = ({ element = {}, className }: Props) => {
    if (!hasAttachments(element)) {
        return null;
    }

    return <Icon name="attach" className={classnames(['color-global-success', className])} />;
};

export default ItemAttachmentIcon;
