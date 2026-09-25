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
}

export const ContextProgressIndicator = ({ attachments, messageChain }: ContextProgressIndicatorProps) => {
    const { usedTokens, fileTokens } = useEffectiveContextUsage(messageChain, attachments);
    const contextLimits = useContextLimits();

    const { totalPercentage, warningLevel } = React.useMemo(() => {
        return {
            totalPercentage: getContextUsagePercentage(usedTokens, contextLimits),
            warningLevel: getContextSizeWarning(usedTokens, contextLimits),
        };
    }, [usedTokens, contextLimits]);

    if (warningLevel === 'none') {
        return null;
    }

    const baseLabel =
        c('collider_2025: Info').t`Space usage: ` + totalPercentage + '% ' + c('collider_2025: Info').t`used`;

    return (
        <div className="flex flex-column flex-nowrap gap-1 mx-2 mt-2">
            <div className="flex flex-row flex-nowrap justify-space-between items-center">
                <span className={clsx('text-sm')}>{baseLabel}</span>
            </div>
            <div className="w-full bg-weak rounded-full border border-weak" style={{ height: '6px' }}>
                <div
                    className="h-full rounded-full transition-all duration-300 ease-in-out"
                    style={{
                        width: `${Math.max(Math.min(totalPercentage, 100), 2)}%`,
                        backgroundColor: '#000000',
                        transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
                    }}
                />
            </div>
            {fileTokens > usedTokens / 2 && (
                <span className="text-xs color-weak">
                    {c('collider_2025: Info').t`Files account for most of this usage.`}
                </span>
            )}
        </div>
    );
};
