import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';

import { countAttachmentToken, getFileSizeLevel } from '../../../llm/utils';
import type { Attachment } from '../../../types';

interface ContextSizeIndicatorProps {
    attachment: Attachment;
}

export const ContextSizeIndicator = ({ attachment }: ContextSizeIndicatorProps) => {
    // Memoize expensive calculations to prevent them from running on every render
    const { sizeLevel } = React.useMemo(() => {
        if (attachment.processing || !attachment.markdown) {
            return { tokenCount: 0, sizeLevel: 'small' as const };
        }

        const tokens = countAttachmentToken(attachment);
        const level = getFileSizeLevel(tokens);

        return { tokenCount: tokens, sizeLevel: level };
    }, [attachment.processing, attachment.markdown]);

    if (sizeLevel === 'small' || sizeLevel === 'medium') {
        return null; // Only show indicators for large files
    }

    const getSizeIndicatorProps = () => {
        return {
            icon: 'exclamation-filled' as const,
            colorClass: 'color-weak',
            label: c('collider_2025: Info').t`Large file`,
            tooltip: c('collider_2025: Info').t`This file uses significant context space`,
        };
    };

    const props = getSizeIndicatorProps();
    if (!props) return null;

    return (
        <Tooltip title={props.tooltip}>
            <span className={clsx('flex items-center gap-1 text-xs', props.colorClass)}>
                <Icon name={props.icon} size={3} className={clsx('shrink-0', props.colorClass)} />
                <span>{props.label}</span>
            </span>
        </Tooltip>
    );
};
