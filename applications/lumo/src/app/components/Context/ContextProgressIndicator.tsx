import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useContextLimits } from '../../hooks/useContextLimits';
import { useEffectiveContextUsage } from '../../hooks/useEffectiveContextUsage';
import { getContextSizeWarning, getContextUsagePercentage } from '../../llm/contextLimits';
import type { Attachment, Message } from '../../types';

interface ContextProgressIndicatorProps {
    attachments: Attachment[];
    messageChain: Message[];
    spaceId?: string;
}

export const ContextProgressIndicator = ({ attachments, messageChain, spaceId }: ContextProgressIndicatorProps) => {
    const { usedTokens, fileTokens, isPending, isUnavailable, isStale } = useEffectiveContextUsage(
        messageChain,
        attachments,
        spaceId
    );
    const contextLimits = useContextLimits(messageChain[0]?.conversationId);

    const { totalPercentage, warningLevel } = React.useMemo(() => {
        return {
            totalPercentage: getContextUsagePercentage(usedTokens, contextLimits),
            warningLevel: getContextSizeWarning(usedTokens, contextLimits),
        };
    }, [usedTokens, contextLimits]);

    if (isUnavailable) {
        return (
            <p className="lumo-body-small lumo-color-glyph-mid mx-2">{c('collider_2025: Info')
                .t`Context estimate unavailable.`}</p>
        );
    }
    if (isPending || warningLevel === 'none') {
        return null;
    }

    const baseLabel =
        c('collider_2025: Info').t`Space usage: ` + totalPercentage + '% ' + c('collider_2025: Info').t`used`;

    return (
        <div className="flex flex-column flex-nowrap gap-1 mx-2 mt-2">
            <div className="flex flex-row flex-nowrap justify-space-between items-center">
                <span className={clsx('lumo-body-small')}>{baseLabel}</span>
            </div>
            {isStale && (
                <span className="lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Info')
                    .t`Showing the last context estimate.`}</span>
            )}
            <div className="w-full border radius-full lumo-bg-control-fill" style={{ height: '6px' }}>
                <div
                    className="h-full radius-full duration-300 lumo-easing-standard"
                    style={{
                        width: `${Math.max(Math.min(totalPercentage, 100), 2)}%`,
                        backgroundColor: '#000000',
                        transitionProperty: 'width, background-color',
                    }}
                />
            </div>
            {fileTokens > usedTokens / 2 && (
                <span className="lumo-body-small lumo-color-glyph-mid">
                    {c('collider_2025: Info').t`Files account for most of this usage.`}
                </span>
            )}
        </div>
    );
};
