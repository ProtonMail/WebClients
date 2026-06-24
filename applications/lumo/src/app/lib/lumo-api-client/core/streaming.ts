import type {
    GenerationResponseMessage,
    GenerationTarget,
    LumoCompletionTarget,
    ServerToolCallMessage,
    ServerToolResultMessage,
} from './types';
import { isGenerationResponseMessage } from './types';

type OpenAiDelta = {
    role?: string;
    content?: string;
    reasoning_content?: string;
    reasoning?: string;
    encrypted?: boolean;
    target?: GenerationTarget;
    tool_calls?: OpenAiToolCallDelta[];
};

type OpenAiToolCallDelta = {
    index?: number;
    function?: {
        name?: string;
        arguments?: string;
    };
};

type OpenAiChunk = {
    choices?: {
        index?: number;
        delta?: OpenAiDelta;
        finish_reason?: string | null;
    }[];
    usage?: Record<string, number>;
    error?: {
        message?: string;
        type?: string;
        code?: string | number;
    };
    target?: GenerationTarget;
};

type LumoImageDataChunk = {
    object: 'lumo.image_data';
    image: {
        id: string;
        data: string;
        seed?: number;
        encrypted?: boolean;
    };
};

type ChatToolCallChunk = {
    object: 'chat.tool_call';
    tool_call: {
        id: string;
        name: string;
        arguments?: string;
        encrypted?: boolean;
    };
};

type ChatToolResultChunk = {
    object: 'chat.tool_result';
    tool_result: {
        call_id: string;
        content: string;
        encrypted?: boolean;
    };
};

type StreamCounters = {
    message: number;
    title: number;
    reasoning: number;
    toolCall: number;
    toolResult: number;
    suggestedQuestions: number;
};

type ToolCallAccumulator = {
    name: string;
    arguments: string;
};

/**
 * Processes OpenAI-compatible SSE chunks from `/ai/v1/chat/completions`
 * and adapts them to the legacy Lumo GenerationResponseMessage format
 * consumed by the rest of the client.
 */
export class StreamProcessor {
    private leftover = '';
    private toolCalls = new Map<number, ToolCallAccumulator>();
    private defaultTarget: GenerationTarget;
    private counters: StreamCounters = {
        message: 0,
        title: 0,
        reasoning: 0,
        toolCall: 0,
        toolResult: 0,
        suggestedQuestions: 0,
    };

    constructor(defaultTarget: LumoCompletionTarget = 'message') {
        this.defaultTarget = defaultTarget;
    }

    processChunk(chunk: string): GenerationResponseMessage[] {
        const lines = (this.leftover + chunk).split('\n');
        this.leftover = lines.pop() || '';
        const parsedData: GenerationResponseMessage[] = [];

        for (const line of lines) {
            parsedData.push(...this.processLine(line));
        }

        return parsedData;
    }

    finalize(): GenerationResponseMessage[] {
        const parsedData: GenerationResponseMessage[] = [];

        if (this.leftover) {
            parsedData.push(...this.processLine(this.leftover));
            this.leftover = '';
        }

        return parsedData;
    }

    reset(): void {
        this.leftover = '';
        this.toolCalls.clear();
        this.counters = {
            message: 0,
            title: 0,
            reasoning: 0,
            toolCall: 0,
            toolResult: 0,
            suggestedQuestions: 0,
        };
    }

    private processLine(line: string): GenerationResponseMessage[] {
        const trimmed = line.trim();
        if (!trimmed) {
            return [];
        }

        if (trimmed.startsWith(':')) {
            return this.processCommentLine(trimmed);
        }

        if (!trimmed.startsWith('data:')) {
            return [];
        }

        const payload = trimmed.slice(5).trim();
        if (!payload) {
            return [];
        }

        if (payload === '[DONE]') {
            return [{ type: 'done' }];
        }

        try {
            const item = JSON.parse(payload) as
                | OpenAiChunk
                | GenerationResponseMessage
                | LumoImageDataChunk
                | ChatToolCallChunk
                | ChatToolResultChunk;

            if (isGenerationResponseMessage(item)) {
                return [this.applyDefaultTarget(item)];
            }

            if ('object' in item) {
                if (item.object === 'lumo.image_data') {
                    return [this.processLumoImageDataChunk(item)];
                }
                if (item.object === 'chat.tool_call') {
                    return [this.processChatToolCallChunk(item)];
                }
                if (item.object === 'chat.tool_result') {
                    return [this.processChatToolResultChunk(item)];
                }
            }

            return this.processOpenAiChunk(item as OpenAiChunk);
        } catch (error) {
            console.warn('Error parsing a data line from chat endpoint', error);
            return [];
        }
    }

    private processLumoImageDataChunk(chunk: LumoImageDataChunk): GenerationResponseMessage {
        return {
            type: 'image_data',
            image_id: chunk.image.id,
            data: chunk.image.data,
            seed: chunk.image.seed,
            encrypted: chunk.image.encrypted,
            is_final: true,
        };
    }

    private processChatToolCallChunk(chunk: ChatToolCallChunk): ServerToolCallMessage {
        const { id, name, arguments: args, encrypted } = chunk.tool_call;
        return {
            type: 'server_tool_call',
            call_id: id,
            name,
            ...(args !== undefined ? { arguments: args } : {}),
            ...(encrypted ? { encrypted: true } : {}),
        };
    }

    private processChatToolResultChunk(chunk: ChatToolResultChunk): ServerToolResultMessage {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { call_id, content, encrypted } = chunk.tool_result;
        return {
            type: 'server_tool_result',
            call_id,
            content,
            ...(encrypted ? { encrypted: true } : {}),
        };
    }

    private processCommentLine(line: string): GenerationResponseMessage[] {
        const comment = line.slice(1).trim();

        switch (comment) {
            case 'queued':
                return [{ type: 'queued' }];
            case 'ingesting':
                return [{ type: 'ingesting', target: this.defaultTarget }];
            default:
                return [];
        }
    }

    private processOpenAiChunk(chunk: OpenAiChunk): GenerationResponseMessage[] {
        if (chunk.error) {
            console.warn('[STREAM] Stream error:', chunk.error);
            return [{ type: 'error' }];
        }

        if (!chunk.choices?.length) {
            return [];
        }

        const choice = chunk.choices[0];
        const messages: GenerationResponseMessage[] = [];

        if (choice.finish_reason === 'content_filter') {
            messages.push({ type: 'harmful' });
        }

        if (!choice.delta) {
            return messages;
        }

        const target = choice.delta.target ?? chunk.target ?? this.defaultTarget;
        messages.push(...this.processDelta(choice.delta, target));

        return messages;
    }

    private processDelta(delta: OpenAiDelta, defaultTarget: GenerationTarget): GenerationResponseMessage[] {
        const messages: GenerationResponseMessage[] = [];

        if (typeof delta.content === 'string' && delta.content.length > 0) {
            messages.push(this.createTokenData(defaultTarget, delta.content, delta.encrypted));
        }

        const reasoning = delta.reasoning_content ?? delta.reasoning;
        if (typeof reasoning === 'string' && reasoning.length > 0) {
            messages.push(this.createTokenData('reasoning', reasoning, delta.encrypted));
        }

        if (Array.isArray(delta.tool_calls)) {
            for (const toolCall of delta.tool_calls) {
                const toolCallMessage = this.processToolCallDelta(toolCall);
                if (toolCallMessage) {
                    messages.push(toolCallMessage);
                }
            }
        }

        return messages;
    }

    private processToolCallDelta(toolCall: OpenAiToolCallDelta): GenerationResponseMessage | null {
        const index = toolCall.index ?? 0;
        const existing = this.toolCalls.get(index) ?? { name: '', arguments: '' };

        if (toolCall.function?.name) {
            existing.name = toolCall.function.name;
        }
        if (toolCall.function?.arguments) {
            existing.arguments += toolCall.function.arguments;
        }

        this.toolCalls.set(index, existing);

        if (!existing.name) {
            return null;
        }

        let parameters: Record<string, unknown> = {};
        if (existing.arguments) {
            try {
                parameters = JSON.parse(existing.arguments);
            } catch {
                return {
                    type: 'token_data',
                    target: 'tool_call',
                    count: this.counters.toolCall++,
                    content: JSON.stringify({
                        name: existing.name,
                        parameters: existing.arguments,
                    }),
                };
            }
        }

        return {
            type: 'token_data',
            target: 'tool_call',
            count: this.counters.toolCall++,
            content: JSON.stringify({
                name: existing.name,
                parameters,
            }),
        };
    }

    private applyDefaultTarget(message: GenerationResponseMessage): GenerationResponseMessage {
        if (message.type === 'token_data' && message.target === 'message' && this.defaultTarget !== 'message') {
            return { ...message, target: this.defaultTarget };
        }

        if (message.type === 'ingesting' && message.target === 'message' && this.defaultTarget !== 'message') {
            return { ...message, target: this.defaultTarget };
        }

        return message;
    }

    private createTokenData(target: GenerationTarget, content: string, encrypted?: boolean): GenerationResponseMessage {
        const counterKey = this.getCounterKey(target);

        return {
            type: 'token_data',
            target,
            count: this.counters[counterKey]++,
            content,
            ...(encrypted ? { encrypted: true } : {}),
        };
    }

    private getCounterKey(target: GenerationTarget): keyof StreamCounters {
        switch (target) {
            case 'title':
                return 'title';
            case 'reasoning':
                return 'reasoning';
            case 'tool_call':
                return 'toolCall';
            case 'tool_result':
                return 'toolResult';
            case 'suggested_questions':
                return 'suggestedQuestions';
            default:
                return 'message';
        }
    }
}
