import { getMessageBlocks } from '../messageHelpers';
import type { Message } from '../types';

type ParsedToolCall = {
    name: string;
    // Only meaningful for web_search; absent when the model omitted it (treated as "general").
    topic?: string;
};

function parseToolCall(content: string): ParsedToolCall | undefined {
    try {
        const toolCall: unknown = JSON.parse(content);
        if (
            typeof toolCall === 'object' &&
            toolCall !== null &&
            'name' in toolCall &&
            typeof toolCall.name === 'string'
        ) {
            let topic: string | undefined;
            if (
                'arguments' in toolCall &&
                typeof toolCall.arguments === 'object' &&
                toolCall.arguments !== null &&
                'topic' in toolCall.arguments &&
                typeof (toolCall.arguments as { topic: unknown }).topic === 'string'
            ) {
                topic = (toolCall.arguments as { topic: string }).topic;
            }
            return { name: toolCall.name, topic };
        }
    } catch {
        // Ignore malformed tool call blocks.
    }
    return undefined;
}

export function getFeedbackTools(message: Message): string[] {
    const tools: string[] = [];
    let latestToolCall: ParsedToolCall | undefined;
    let pendingBareIndex: number | undefined;

    for (const block of getMessageBlocks(message)) {
        if (block.type === 'tool_call') {
            latestToolCall = parseToolCall(block.content);
            if (latestToolCall) {
                tools.push(latestToolCall.name);
                pendingBareIndex = tools.length - 1;
            }
            continue;
        }

        if (block.type === 'tool_result' && latestToolCall) {
            const { name, topic } = latestToolCall;
            if (block.meta?.settings) {
                if (name === 'web_search') {
                    const decorated = `web_search(${block.meta.settings}, ${topic ?? 'general'})`;
                    if (pendingBareIndex !== undefined) {
                        tools[pendingBareIndex] = decorated;
                    } else {
                        tools.push(decorated);
                    }
                } else if (name === 'web_extract') {
                    const decorated = `web_extract(${block.meta.settings})`;
                    if (pendingBareIndex !== undefined) {
                        tools[pendingBareIndex] = decorated;
                    } else {
                        tools.push(decorated);
                    }
                }
            }
            pendingBareIndex = undefined;
            latestToolCall = undefined;
        }
    }

    return tools;
}
