import { CREATE_SCHEDULE_TOOL_NAME } from '../../../../../features/client-tools/createScheduleTool/createScheduleTool';
import {
    isCreateScheduleToolSuccessResult,
    validateCreateScheduleToolArguments,
} from '../../../../../features/client-tools/createScheduleTool/validation';
import { findToolResultForCall } from '../../../../../messageHelpers';
import type { ContentBlock } from '../../../../../types';
import { ComposerPreInputPortal } from '../../../../Composer/ComposerPreInputPortal';
import { getToolCallNameFromBlock } from '../../../artifact/artifactGenerationState';
import { getLastValidatedToolCall } from '../getLastValidatedToolCall';
import { CreateScheduleToolMessageCompleted } from './CreateScheduleToolMessageCompleted';
import { CreateScheduleToolMessageSkeleton } from './CreateScheduleToolMessageSkeleton';

/** Select the pending or completed schedule draft view above the composer. */
export const CreateScheduleToolMessage = ({
    blocks,
    isGenerating,
}: {
    blocks: ContentBlock[];
    isGenerating: boolean;
}) => {
    const latestCall = blocks.findLast(
        (block) => block.type === 'tool_call' && getToolCallNameFromBlock(block) === CREATE_SCHEDULE_TOOL_NAME
    );

    if (isGenerating && latestCall?.type === 'tool_call' && !findToolResultForCall(blocks, latestCall)) {
        return (
            <ComposerPreInputPortal>
                <CreateScheduleToolMessageSkeleton />
            </ComposerPreInputPortal>
        );
    }

    if (isGenerating) return null;

    const draft = getLastValidatedToolCall(
        blocks,
        CREATE_SCHEDULE_TOOL_NAME,
        isCreateScheduleToolSuccessResult,
        validateCreateScheduleToolArguments
    );

    if (!draft) return null;

    return (
        <ComposerPreInputPortal>
            <CreateScheduleToolMessageCompleted draft={draft.arguments} key={draft.id} />
        </ComposerPreInputPortal>
    );
};
