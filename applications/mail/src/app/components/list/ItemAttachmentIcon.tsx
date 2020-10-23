import React from 'react';
import { c, msgid } from 'ttag';
import { classnames, Icon, Tooltip } from 'react-components';

import { getNumAttachments } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    labelID: string;
    className?: string;
}

const ItemAttachmentIcon = ({ element = {}, labelID, className }: Props) => {
    const numAttachments = getNumAttachments(element, labelID);

    if (numAttachments === 0) {
        return null;
    }

    const title = c('Info').ngettext(
        msgid`Has ${numAttachments} attachement`,
        `Has ${numAttachments} attachements`,
        numAttachments
    );

    return (
        <Tooltip title={title} className={classnames(['flex', className])}>
            <div className="pill-icon pill-icon-attachment">
                <Icon name="attach" size={14} alt={title} />
            </div>
        </Tooltip>
    );
};

export default ItemAttachmentIcon;
