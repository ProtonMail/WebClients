import { MouseEvent, createElement } from 'react';
import { c, msgid } from 'ttag';
import { classnames, Icon, Tooltip } from '@proton/components';

import { getNumAttachments } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
    onClick?: (e: MouseEvent) => void;
    icon?: string;
}

const ItemAttachmentIcon = ({ element, className, onClick, icon = 'paperclip' }: Props) => {
    const numAttachments = element ? getNumAttachments(element) : 0;
    const isButton = onClick !== undefined;

    if (numAttachments === 0) {
        return null;
    }

    const title = icon.includes('calendar')
        ? c('Calendar attachment tooltip').t`Has a calendar event`
        : c('Info').ngettext(
              msgid`Has ${numAttachments} attachment`,
              `Has ${numAttachments} attachments`,
              numAttachments
          );

    const commonProps = {
        className: classnames(['flex', className]),
        'data-testid': 'item-attachment-icon',
    };
    const buttonProps = {
        onClick,
        type: 'button',
    };

    return (
        <Tooltip title={title}>
            {createElement(
                isButton ? 'button' : 'div',
                { ...commonProps, ...(isButton ? buttonProps : {}) },
                <Icon name={icon} size={16} alt={title} />
            )}
        </Tooltip>
    );
};

export default ItemAttachmentIcon;
