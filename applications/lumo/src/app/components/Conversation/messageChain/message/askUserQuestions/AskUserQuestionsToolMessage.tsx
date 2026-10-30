import { useState } from 'react';

import { ASK_USER_QUESTIONS_TOOL_NAME } from '../../../../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import {
    isAskUserQuestionsToolSuccessResult,
    validateAskUserQuestionsToolArguments,
} from '../../../../../features/client-tools/askUserQuestionsTool/validation';
import { findToolResultForCall } from '../../../../../messageHelpers';
import { useConversationActions } from '../../../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import type { ContentBlock } from '../../../../../types';
import { ComposerPreInputPortal } from '../../../../Composer/ComposerPreInputPortal';
import { QuestionCard } from '../../../../QuestionCard/QuestionCard';
import type { QuestionCardAnswerData } from '../../../../QuestionCard/types';
import { getToolCallNameFromBlock } from '../../../artifact/artifactGenerationState';
import { getLastValidatedToolCall } from '../getLastValidatedToolCall';
import { AskUserQuestionsToolMessageSkeleton } from './AskUserQuestionsToolMessageSkeleton';

/**
 * Render a pending skeleton or validated question card above the composer.
 * The successful result acknowledges validation; the questions come from the matching tool-call arguments.
 */
export const AskUserQuestionsToolMessage = ({
    blocks,
    isGenerating,
}: {
    blocks: ContentBlock[];
    isGenerating: boolean;
}) => {
    const { handleSendAskUserQuestionsToolResponse } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();
    const [isClosed, setIsClosed] = useState(false);
    const latestCall = blocks.findLast(
        (block) => block.type === 'tool_call' && getToolCallNameFromBlock(block) === ASK_USER_QUESTIONS_TOOL_NAME
    );

    if (isGenerating && latestCall?.type === 'tool_call' && !findToolResultForCall(blocks, latestCall)) {
        return (
            <ComposerPreInputPortal>
                <AskUserQuestionsToolMessageSkeleton />
            </ComposerPreInputPortal>
        );
    }

    if (isGenerating) return null;

    const latestQuestionSet = getLastValidatedToolCall(
        blocks,
        ASK_USER_QUESTIONS_TOOL_NAME,
        isAskUserQuestionsToolSuccessResult,
        validateAskUserQuestionsToolArguments
    );

    if (!latestQuestionSet || isClosed) return null;

    const {
        id,
        arguments: { questions },
    } = latestQuestionSet;

    const submit = async (answers: QuestionCardAnswerData[]) => {
        setIsClosed(true);
        // Combine each question and its submitted answer into the database-ready QuestionAnswer structure,
        // preserving the title, selected values, and skipped status for storage with the user message.
        const askUserQuestionsToolResponse = questions.map((question) => {
            const answer = answers.find((answer) => answer.questionId === question.id);
            return {
                questionId: question.id,
                title: question.title,
                ...(answer?.selections.length ? { answers: [...answer.selections] } : { skipped: true }),
            };
        });
        await handleSendAskUserQuestionsToolResponse(askUserQuestionsToolResponse, isWebSearchButtonToggled);
    };

    return (
        <ComposerPreInputPortal>
            <QuestionCard
                key={id}
                questions={questions}
                onSubmit={(answers) => {
                    submit(answers).catch(() => console.error('Failed to submit question answers'));
                }}
                onDismiss={() => setIsClosed(true)}
            />
        </ComposerPreInputPortal>
    );
};
