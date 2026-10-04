import type { MouseEvent } from 'react';
import { createElement } from 'react';

import { c, msgid } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useFeature } from '@proton/features/index';
import { FeatureCode } from '@proton/features/interface';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcPaperClip } from '@proton/icons/icons/IcPaperClip';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { getNumAttachments } from '../../helpers/elements';
import type { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
    onClick?: (e: MouseEvent) => void;
    /** Shows a calendar event rather than a paper clip, for elements whose only attachments are calendar invites */
    hasOnlyIcsAttachments?: boolean;
}

const ItemAttachmentIcon = ({ element, className, onClick, hasOnlyIcsAttachments = false }: Props) => {
    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;

    const numAttachments = element ? getNumAttachments(element, !isNumAttachmentsWithoutEmbedded) : 0;
    const numAttachmentsSize = element ? humanSize({ bytes: element.Size }) : 0;
    const isButton = onClick !== undefined;

    if (numAttachments === 0) {
        return null;
    }

    const AttachmentIcon = hasOnlyIcsAttachments ? IcCalendarGrid : IcPaperClip;
    const title = hasOnlyIcsAttachments
        ? c('Calendar attachment tooltip').t`Has a calendar event`
        : c('Info').ngettext(
              msgid`Has ${numAttachments} attachment (${numAttachmentsSize})`,
              `Has ${numAttachments} attachments (${numAttachmentsSize})`,
              numAttachments
          );

    const commonProps = {
        className: clsx(['flex', className]),
        // Kept as the sprite names these were built from: the e2e page objects locate the icon by them
        'data-testid': `item-attachment-icon-${hasOnlyIcsAttachments ? 'calendar-grid' : 'paper-clip'}`,
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
                <AttachmentIcon size={4} alt={title} />
            )}
        </Tooltip>
    );
};

export default ItemAttachmentIcon;
