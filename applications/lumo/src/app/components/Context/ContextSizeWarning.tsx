import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useConversationFiles } from '../../hooks';
import { CONTEXT_LIMITS, calculateAttachmentContextSize, calculateMessageContentTokens } from '../../llm/utils';
import type { Attachment, Message } from '../../types';

interface ContextSizeWarningProps {
    attachments: Attachment[];
    messageChain: Message[];
    onOpenFiles?: () => void;
}

export const ContextSizeWarning = ({ attachments, messageChain, onOpenFiles }: ContextSizeWarningProps) => {
    const { activeFiles } = useConversationFiles(messageChain, attachments);

    const { tokenCount, warningLevel } = React.useMemo(() => {
        const messageContentTokens = calculateMessageContentTokens(messageChain);

        // Calculate tokens from currently active files (what would actually be sent to LLM)
        const activeFilesTokens = calculateAttachmentContextSize(activeFiles);

        const totalTokens = messageContentTokens + activeFilesTokens;

        let level: 'none' | 'critical' = 'none';
        if (totalTokens >= CONTEXT_LIMITS.MAX_CONTEXT) {
            level = 'critical';
        }

        return {
            tokenCount: activeFilesTokens,
            warningLevel: level,
        };
    }, [messageChain, activeFiles]);

    // Show warnings for warning level and above since we want to inform users early
    if (warningLevel === 'none' || tokenCount === 0) {
        return null;
    }

    const getWarningProps = () => {
        switch (warningLevel) {
            case 'critical':
                return {
                    icon: 'exclamation-triangle-filled' as const,
                    colorClass: '',
                    message: c('collider_2025:Info')
                        .t`Your files are large. ${LUMO_SHORT_APP_NAME} may not be able to process all information.`,
                };
            default:
                return null;
        }
    };

    const warningProps = getWarningProps();
    if (!warningProps) return null;

    return (
        <div className="flex flex-row flex-nowrap gap-2 mx-2 mb-2 p-2">
            <div className="flex-1">
                <p className={clsx('text-sm m-0', warningProps.colorClass)}>{warningProps.message}</p>
            </div>
            {onOpenFiles && (
                <Button
                    size="small"
                    shape="underline"
                    color="weak"
                    className="text-sm px-2 py-1"
                    onClick={() => onOpenFiles()}
                >
                    {c('collider_2025: Info').t`Manage files`}
                </Button>
            )}
        </div>
    );
};
