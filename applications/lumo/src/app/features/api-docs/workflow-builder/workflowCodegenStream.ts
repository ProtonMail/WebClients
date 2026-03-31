import type { GenerationResponseMessage } from '../../../lib/lumo-api-client';

/**
 * Accumulates assistant message text from streamed chunks and enforces terminal error types.
 * Only `token_data` with `target === 'message'` is appended; other targets (title, tools, etc.) are ignored.
 */
export function appendWorkflowCodegenAssistantText(
    accumulated: string,
    message: GenerationResponseMessage
): string {
    switch (message.type) {
        case 'error':
        case 'timeout':
        case 'rejected':
        case 'harmful':
            throw new Error(`workflow_codegen_generation_${message.type}`);
        case 'token_data':
            if (message.target === 'message') {
                return accumulated + message.content;
            }
            return accumulated;
        default:
            return accumulated;
    }
}
