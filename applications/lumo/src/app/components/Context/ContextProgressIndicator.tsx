import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useEffectiveContextUsage } from '../../hooks/useEffectiveContextUsage';
import { CONTEXT_LIMITS } from '../../llm/utils';
import type { Attachment, Message } from '../../types';

interface ContextProgressIndicatorProps {
    attachments: Attachment[];
    messageChain: Message[];
}

export const ContextProgressIndicator = ({ attachments, messageChain }: ContextProgressIndicatorProps) => {
    const { usedTokens, fileTokens } = useEffectiveContextUsage(messageChain, attachments);

    const { totalPercentage, warningLevel } = React.useMemo(() => {
        const percentage = Math.round((usedTokens / CONTEXT_LIMITS.MAX_CONTEXT) * 100);

        let level: 'none' | 'warning' | 'danger' | 'critical' = 'none';
        if (usedTokens >= CONTEXT_LIMITS.MAX_CONTEXT) {
            level = 'critical';
        } else if (usedTokens >= CONTEXT_LIMITS.DANGER_THRESHOLD) {
            level = 'danger';
        } else if (usedTokens >= CONTEXT_LIMITS.WARNING_THRESHOLD) {
            level = 'warning';
        }

        return {
            totalPercentage: percentage,
            warningLevel: level,
        };
    }, [usedTokens]);

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
