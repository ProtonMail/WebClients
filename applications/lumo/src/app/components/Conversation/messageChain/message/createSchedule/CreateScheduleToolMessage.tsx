import { useState } from 'react';

import type { CreateScheduleToolArguments } from '../../../../../features/client-tools/createScheduleTool/createScheduleTool';
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
import { AccessRequestMessage } from './AccessRequestMessage';
import { CreateScheduleToolMessageReadyView } from './CreateScheduleToolMessageReadyView';
import { CreateScheduleToolMessageSkeleton } from './CreateScheduleToolMessageSkeleton';

/** Select the pending, access request, or review step above the composer. */
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
            <CreateScheduleToolMessageInner key={draft.id} draft={draft.arguments} />
        </ComposerPreInputPortal>
    );
};

const CreateScheduleToolMessageInner = ({ draft }: { draft: CreateScheduleToolArguments }) => {
    const [approvedConnectorIds, setApprovedConnectorIds] = useState<Set<string> | null>(null);

    if (draft.connectors.length > 0 && approvedConnectorIds === null) {
        return <AccessRequestMessage draft={draft} onComplete={setApprovedConnectorIds} />;
    }

    return (
        <CreateScheduleToolMessageReadyView
            draft={{
                ...draft,
                connectors: draft.connectors.filter(({ id }) => approvedConnectorIds?.has(id)),
            }}
        />
    );
};
