import { ASK_USER_QUESTIONS_TOOL_NAME } from '../../../../../features/client-tools/askUserQuestionsTool/askUserQuestionsTool';
import { isAskUserQuestionsInvalidArgumentsResult } from '../../../../../features/client-tools/askUserQuestionsTool/validation';
import { findToolResultForCall } from '../../../../../messageHelpers';
import type { ContentBlock, ToolResultBlock } from '../../../../../types';
import { getToolCallNameFromBlock } from '../../../artifact/artifactGenerationState';

/** Whether an ask_user_questions result block reports arguments that failed validation. */
export function isAskUserQuestionsInvalidArgumentsBlock(result: ToolResultBlock): boolean {
    if (result.toolResult !== undefined) return isAskUserQuestionsInvalidArgumentsResult(result.toolResult);
    try {
        return isAskUserQuestionsInvalidArgumentsResult(JSON.parse(result.content));
    } catch {
        return false;
    }
}

/** Blocks that show the model moved on: another tool round or prose. Empty text placeholders do not count. */
function isMeaningfulBlock(block: ContentBlock): boolean {
    return block.type !== 'text' || block.content.trim().length > 0;
}

/**
 * Show the question skeleton while ask_user_questions is being prepared during generation.
 *
 * - The latest ask_user_questions call has no result yet: its arguments are streaming or being validated.
 * - Heuristic: its result is an invalid-arguments failure and nothing has followed it yet. The model is told to
 *   correct the fields and call the tool again, so keep the skeleton up through the gap instead of flickering.
 *   A later call to another tool, any prose, or the end of the generation hides it.
 */
export function shouldShowAskUserQuestionsSkeleton(blocks: ContentBlock[], isGenerating: boolean): boolean {
    if (!isGenerating) return false;

    const latestCall = blocks.findLast(
        (block) => block.type === 'tool_call' && getToolCallNameFromBlock(block) === ASK_USER_QUESTIONS_TOOL_NAME
    );
    if (latestCall?.type !== 'tool_call') return false;

    const result = findToolResultForCall(blocks, latestCall);
    if (!result) return true;
    if (!isAskUserQuestionsInvalidArgumentsBlock(result)) return false;

    return !blocks.slice(blocks.indexOf(result) + 1).some(isMeaningfulBlock);
}
