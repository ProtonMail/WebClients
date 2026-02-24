import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useConversationFiles } from '../../hooks';
import {
    CONTEXT_LIMITS,
    calculateAttachmentContextSize,
    calculateMessageContentTokens,
    getContextProgressState,
} from '../../llm/utils';
import type { Attachment, Message } from '../../types';

interface ContextProgressIndicatorProps {
    attachments: Attachment[];
    messageChain: Message[];
}

export const ContextProgressIndicator = ({ attachments, messageChain }: ContextProgressIndicatorProps) => {
    // Use the custom hook to get file calculations
    const { activeFiles } = useConversationFiles(messageChain, attachments);

    // Calculate what the actual context size would be for the next message
    const { tokenCount, totalPercentage, warningLevel } = React.useMemo(() => {
        // Calculate tokens from message content (excluding their cached context)
        const messageContentTokens = calculateMessageContentTokens(messageChain);

        // Calculate tokens from currently active files (what would actually be sent to LLM)
        const activeFilesTokens = calculateAttachmentContextSize(activeFiles);

        const totalTokens = messageContentTokens + activeFilesTokens;
        const percentage = Math.min(100, Math.round((totalTokens / CONTEXT_LIMITS.MAX_CONTEXT) * 100));
        const state = getContextProgressState(percentage);

        // Create breakdown for display
        const calculatedBreakdown = {
            conversationSize: messageContentTokens,
            currentAttachmentsSize: activeFilesTokens,
            totalSize: totalTokens,
            conversationPercentage: totalTokens > 0 ? Math.round((messageContentTokens / totalTokens) * 100) : 0,
            currentAttachmentsPercentage: totalTokens > 0 ? Math.round((activeFilesTokens / totalTokens) * 100) : 0,
        };

        // Determine warning level
        let level: 'none' | 'warning' | 'danger' | 'critical' = 'none';
        if (totalTokens >= CONTEXT_LIMITS.MAX_CONTEXT) {
            level = 'critical';
        } else if (totalTokens >= CONTEXT_LIMITS.DANGER_THRESHOLD) {
            level = 'danger';
        } else if (totalTokens >= CONTEXT_LIMITS.WARNING_THRESHOLD) {
            level = 'warning';
        }

        return {
            tokenCount: activeFilesTokens,
            totalPercentage: percentage,
            progressState: state,
            breakdown: calculatedBreakdown,
            warningLevel: level,
        };
    }, [messageChain, activeFiles]);

    // Only show if we have attachments and we're at warning level or above
    if (tokenCount === 0 || warningLevel === 'none') {
        return null;
    }

    const getProgressProps = () => {
        const baseLabel =
            c('collider_2025: Info').t`Space usage: ` + totalPercentage + '% ' + c('collider_2025: Info').t`used`;
        return {
            textColor: '',
            label: baseLabel,
        };
    };

    const progressProps = getProgressProps();
    if (!progressProps) return null;

    return (
        <div className="flex flex-column flex-nowrap gap-1 mx-2 mt-2">
            <div className="flex flex-row flex-nowrap justify-space-between items-center">
                <span className={clsx('text-sm')}>{progressProps.label}</span>
            </div>
            <div className="w-full bg-weak rounded-full border border-weak" style={{ height: '6px' }}>
                <div
                    className="h-full rounded-full transition-all duration-300 ease-in-out"
                    style={{
                        width: `${Math.max(totalPercentage, 2)}%`,
                        backgroundColor: '#000000',
                        transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
                    }}
                />
            </div>
        </div>
    );
};
