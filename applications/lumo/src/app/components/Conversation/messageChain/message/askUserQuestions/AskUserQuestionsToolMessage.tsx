import { useState } from 'react';

import type { AskUserQuestionsToolArguments } from '../../../../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
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

/**
 * Find the last renderable question set in one assistant message's blocks.
 * Questions live in the tool-call arguments; the result only acknowledges successful validation.
 * Calls without a successful result, malformed JSON, and invalid arguments are omitted.
 */
function getLastQuestionSet(
    blocks: ContentBlock[]
): { id: string | number; questions: AskUserQuestionsToolArguments['questions'] } | null {
    // Search backward so only the newest successfully validated call is rendered.
    for (let index = blocks.length - 1; index >= 0; index--) {
        const block = blocks[index];
        if (block.type !== 'tool_call' || getToolCallNameFromBlock(block) !== ASK_USER_QUESTIONS_TOOL_NAME) {
            continue;
        }
        const resultBlock = findToolResultForCall(blocks, block);
        if (!resultBlock) continue;

        let call: { id?: string; arguments?: unknown };
        let acknowledgement: unknown;
        try {
            // Prefer the structured call when available; otherwise decode the raw block content.
            call = block.toolCall ?? JSON.parse(block.content);
            acknowledgement = JSON.parse(resultBlock.content);
        } catch {
            // An incomplete or malformed block should not prevent other question sets from rendering.
            continue;
        }

        if (!isAskUserQuestionsToolSuccessResult(acknowledgement)) continue;

        // Reuse the executor's validator before passing stored/streamed arguments to QuestionCard.
        const validation = validateAskUserQuestionsToolArguments(call.arguments);
        if (validation.ok) {
            // Keep card state tied to the call id; older blocks without an id use their original index.
            return { id: call.id ?? index, questions: validation.value.questions };
        }
    }

    return null;
}

/**
 * Render the ask_user_questions tool result as a question card above the composer.
 * The successful result acknowledges validation; the questions come from the matching tool-call arguments.
 */
export const AskUserQuestionsToolMessage = ({ blocks }: { blocks: ContentBlock[] }) => {
    const { handleSendQuestionAnswers } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();
    const [isClosed, setIsClosed] = useState(false);
    const latestQuestionSet = getLastQuestionSet(blocks);

    if (!latestQuestionSet || isClosed) return null;

    const { id, questions } = latestQuestionSet;

    const submit = async (answers: QuestionCardAnswerData[]) => {
        setIsClosed(true);
        // Combine each question and its submitted answer into the database-ready QuestionAnswer structure,
        // preserving the title, selected values, and skipped status for storage with the user message.
        const questionAnswers = questions.map((question) => {
            const answer = answers.find((answer) => answer.questionId === question.id);
            return {
                questionId: question.id,
                title: question.title,
                ...(answer?.selections.length ? { answers: [...answer.selections] } : { skipped: true }),
            };
        });
        await handleSendQuestionAnswers(questionAnswers, isWebSearchButtonToggled);
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
