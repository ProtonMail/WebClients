import { ASK_USER_QUESTIONS_TOOL_NAME } from '../../../../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import {
    isAskUserQuestionsToolSuccessResult,
    validateAskUserQuestionsToolArguments,
} from '../../../../../features/client-tools/askUserQuestionsTool/validation';
import { useConversationActions } from '../../../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import type { ContentBlock } from '../../../../../types';
import { ComposerPreInputPortal } from '../../../../Composer/ComposerPreInputPortal';
import { QuestionCard } from '../../../../QuestionCard/QuestionCard';
import type { QuestionCardAnswerData } from '../../../../QuestionCard/types';
import { getLastValidatedToolCall } from '../getLastValidatedToolCall';
import { AskUserQuestionsToolMessageSkeleton } from './AskUserQuestionsToolMessageSkeleton';
import { shouldShowAskUserQuestionsSkeleton } from './shouldShowAskUserQuestionsSkeleton';

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

    if (shouldShowAskUserQuestionsSkeleton(blocks, isGenerating)) {
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

    if (!latestQuestionSet) return null;

    const {
        id,
        arguments: { questions },
    } = latestQuestionSet;
    const submit = async (answers: QuestionCardAnswerData[]) => {
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
            />
        </ComposerPreInputPortal>
    );
};
