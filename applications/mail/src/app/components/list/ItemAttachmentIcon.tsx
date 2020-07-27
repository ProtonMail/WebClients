import React from 'react';
import { c } from 'ttag';
import { Icon } from 'react-components';

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

    return <Icon name="attach" className={className} alt={c('Alt').t`Has attachments`} />;
};

export default ItemAttachmentIcon;
