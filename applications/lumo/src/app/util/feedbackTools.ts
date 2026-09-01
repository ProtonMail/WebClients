import { findToolResultForCall, getMessageBlocks } from '../messageHelpers';
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
    const blocks = getMessageBlocks(message);

    for (const block of blocks) {
        if (block.type !== 'tool_call') continue;

        const toolCall = parseToolCall(block.content);
        if (!toolCall) continue;

        const settings = findToolResultForCall(blocks, block)?.meta?.settings;
        if (settings && toolCall.name === 'web_search') {
            tools.push(`web_search(${settings}, ${toolCall.topic ?? 'general'})`);
        } else if (settings && toolCall.name === 'web_extract') {
            tools.push(`web_extract(${settings})`);
        } else {
            tools.push(toolCall.name);
        }
    }

    return tools;
}
