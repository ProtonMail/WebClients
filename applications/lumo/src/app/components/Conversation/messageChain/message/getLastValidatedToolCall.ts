import type { ValidationResult } from '../../../../features/client-tools/validationUtils';
import { findToolResultForCall } from '../../../../messageHelpers';
import type { ContentBlock } from '../../../../types';
import { getToolCallNameFromBlock } from '../../artifact/artifactGenerationState';

/** Find the latest acknowledged call whose arguments pass the tool's validator. */
export function getLastValidatedToolCall<T>(
    blocks: ContentBlock[],
    toolName: string,
    isSuccessResult: (value: unknown) => boolean,
    validateArguments: (value: unknown) => ValidationResult<T>
): { id: string | number; arguments: T } | null {
    for (let index = blocks.length - 1; index >= 0; index--) {
        const block = blocks[index];
        if (block.type !== 'tool_call' || getToolCallNameFromBlock(block) !== toolName) continue;

        // A streamed call can arrive before execution finishes; require its matching result.
        const result = findToolResultForCall(blocks, block);
        if (!result) continue;

        try {
            // Persisted blocks may contain only raw JSON instead of a structured toolCall.
            const call: { id?: string; arguments?: unknown } = block.toolCall ?? JSON.parse(block.content);

            if (!isSuccessResult(JSON.parse(result.content))) continue;

            const validation = validateArguments(call.arguments);
            if (validation.ok) {
                // Older calls without an id use their original block index as the React key.
                return { id: call.id ?? index, arguments: validation.value };
            }
        } catch {
            // Partial or malformed streamed blocks must not prevent other calls from rendering.
            continue;
        }
    }

    return null;
}
