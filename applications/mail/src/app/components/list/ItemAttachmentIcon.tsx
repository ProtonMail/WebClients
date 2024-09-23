import type { MouseEvent } from 'react';
import { createElement } from 'react';

import { c, msgid } from 'ttag';

import { Tooltip } from '@proton/components';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { getNumAttachments } from '../../helpers/elements';
import type { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
    onClick?: (e: MouseEvent) => void;
    icon?: IconName;
}

const ItemAttachmentIcon = ({ element, className, onClick, icon = 'paper-clip' }: Props) => {
    const numAttachments = element ? getNumAttachments(element) : 0;
    const numAttachmentsSize = element ? humanSize({ bytes: element.Size }) : 0;
    const isButton = onClick !== undefined;

    if (numAttachments === 0) {
        return null;
    }

    const title = icon.includes('calendar')
        ? c('Calendar attachment tooltip').t`Has a calendar event`
        : c('Info').ngettext(
              msgid`Has ${numAttachments} attachment (${numAttachmentsSize})`,
              `Has ${numAttachments} attachments (${numAttachmentsSize})`,
              numAttachments
          );

    const commonProps = {
        className: clsx(['flex', className]),
        'data-testid': `item-attachment-icon-${icon}`,
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
                <Icon name={icon} size={4} alt={title} />
            )}
        </Tooltip>
    );
};

export default ItemAttachmentIcon;
