import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useEffectiveContextUsage } from '../../hooks/useEffectiveContextUsage';
import { CONTEXT_LIMITS } from '../../llm/utils';
import type { Attachment, Message } from '../../types';

interface ContextSizeWarningProps {
    attachments: Attachment[];
    messageChain: Message[];
    onOpenFiles?: () => void;
}

export const ContextSizeWarning = ({ attachments, messageChain, onOpenFiles }: ContextSizeWarningProps) => {
    const { usedTokens, fileTokens } = useEffectiveContextUsage(messageChain, attachments);

    const warningLevel = usedTokens >= CONTEXT_LIMITS.MAX_CONTEXT ? 'critical' : 'none';

    if (warningLevel === 'none') {
        return null;
    }

    const message =
        fileTokens > 0
            ? c('collider_2025:Info')
                  .t`Your files are large. ${LUMO_SHORT_APP_NAME} may summarize earlier messages to make room — your chat history will stay in this conversation.`
            : c('collider_2025:Info')
                  .t`This conversation is nearly full. ${LUMO_SHORT_APP_NAME} may summarize earlier messages to keep replying — nothing is removed from your chat history.`;

    return (
        <div className="flex flex-row flex-nowrap gap-2 mx-2 mb-2 p-2">
            <div className="flex-1">
                <p className={clsx('text-sm m-0')}>{message}</p>
            </div>
            {onOpenFiles && fileTokens > 0 && (
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
