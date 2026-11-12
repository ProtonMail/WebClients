import { createContext, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { AnswerNowPrompt } from '@proton/lumo-api-client/types-api';

import { useLumoDispatch } from '../../../../../redux/hooks';
import { saveConversationModelTier } from '../../../../../redux/slices/core/conversations';
import type { ConversationId } from '../../../../../types';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';
import { ThinkingProgressDots } from './toolCallTimeline/ThinkingProgressDots';

import './AnswerNowNotice.scss';

export const AnswerNowButtonContainerContext = createContext<HTMLDivElement | null | undefined>(undefined);

interface Props {
    prompt?: AnswerNowPrompt;
    conversationId: ConversationId;
}

export const AnswerNowNotice = ({ prompt, conversationId }: Props) => {
    const buttonContainer = useContext(AnswerNowButtonContainerContext);
    const api = useApi();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const activeJobIdRef = useRef(prompt?.job_id);
    activeJobIdRef.current = prompt?.job_id;
    const [sendingJobId, setSendingJobId] = useState<string>();
    const [sentJobId, setSentJobId] = useState<string>();
    const sending = prompt !== undefined && sendingJobId === prompt.job_id;
    const sent = prompt !== undefined && sentJobId === prompt.job_id;
    const showButton = prompt !== undefined && !sent;
    const answerNow = async () => {
        if (prompt === undefined || sending || sent) {
            return;
        }
        const jobId = prompt.job_id;
        setSendingJobId(jobId);
        try {
            await api({
                method: 'post',
                output: 'raw',
                url: `ai/v1/jobs/${encodeURIComponent(jobId)}/answer-now`,
                silence: true,
            });
            dispatch(saveConversationModelTier({ id: conversationId, modelTier: 'lumo-lite', answerNowUsed: true }));
            if (activeJobIdRef.current === jobId) {
                setSentJobId(jobId);
            }
        } catch {
            createNotification({ type: 'error', text: c('Error').t`Could not switch to Lite. Please try again.` });
        } finally {
            setSendingJobId((currentJobId) => (currentJobId === jobId ? undefined : currentJobId));
        }
    };
    const button = (
        <span
            className={`answer-now-pill-container${showButton ? ' answer-now-pill-container--visible' : ''}`}
            aria-hidden={!showButton}
        >
            <Button
                className="answer-now-pill"
                size="small"
                shape="outline"
                pill
                loading={sending}
                disabled={!showButton || sending}
                onClick={answerNow}
            >
                <LumoIcon name="Zap" size={16} strokeWidth={1.4} aria-hidden="true" />
                <span>{c('Action').t`Answer now`}</span>
            </Button>
        </span>
    );

    return (
        <>
            {prompt !== undefined && (
                <output className="answer-now-notice flex items-center color-weak" aria-live="polite">
                    <span>{sent ? c('Info').t`Requesting an answer…` : c('Info').t`Working on it...`}</span>
                    {showButton && <ThinkingProgressDots />}
                </output>
            )}
            {buttonContainer ? createPortal(button, buttonContainer) : buttonContainer === undefined ? button : null}
        </>
    );
};
