import { isTurn } from '../../types';
import { type RequestId, Role, type Turn } from './index';

/**
 * Simple message interface for convenience
 */
export interface Message {
    role: Role;
    content: string;
}

/**
 * Convert simple messages to conversation turns
 */
export function prepareTurns(messages: Message[]): Turn[] {
    return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
    }));
}

/**
 * Create a user turn
 */
export function createUserTurn(content: string): Turn {
    return { role: Role.User, content };
}

/**
 * Create an assistant turn
 */
export function createAssistantTurn(content: string): Turn {
    return { role: Role.Assistant, content };
}

/**
 * Create a system turn
 */
export function createSystemTurn(content: string): Turn {
    return { role: Role.System, content };
}

/**
 * Create a tool call turn
 */
export function createToolCallTurn(content: string): Turn {
    return { role: Role.ToolCall, content };
}

/**
 * Create a tool result turn
 */
export function createToolResultTurn(content: string): Turn {
    return { role: Role.ToolResult, content };
}

/**
 * Post-process generated titles (remove quotes, trim, etc.)
 */
export function postProcessTitle(title: string): string {
    // Remove surrounding quotes if present
    let processed = title.replace(/^["']|["']$/g, '');

    // Trim whitespace
    processed = processed.trim();

    // Limit length (optional)
    if (processed.length > 100) {
        processed = processed.substring(0, 97) + '...';
    }

    return processed || 'Untitled Conversation';
}

/**
 * Rough token count estimation (for rate limiting, etc.)
 * This is a simple heuristic, not precise
 */
export function estimateTokenCount(text: string): number {
    // Very rough approximation: ~4 characters per token on average
    // This varies significantly by language and content type
    return Math.ceil(text.length / 4);
    // todo: we could use tiktoken in the browser like https://platform.openai.com/tokenizer
    //       still an estimate, but slightly better
}

/**
 * Estimate token count for conversation turns
 */
export function estimateConversationTokens(turns: Turn[]): number {
    return turns.reduce((total, turn) => {
        const content = turn.content || '';
        return total + estimateTokenCount(content);
    }, 0);
    // todo: also account for a few tokens more due to the turn markers
}

/**
 * Clean and validate turns array
 */
export function cleanTurns(turns: any[]): Turn[] {
    return turns.filter(isTurn).map((turn) => ({
        role: turn.role,
        content: turn.content || '',
        ...(turn.encrypted && { encrypted: turn.encrypted }),
    }));
}

/**
 * Create a conversation context string for debugging
 */
export function formatConversationForDebug(turns: Turn[]): string {
    return turns
        .map((turn, index) => `${index + 1}. [${turn.role.toUpperCase()}]: ${turn.content || '<empty>'}`)
        .join('\n');
}

/**
 * Extract last user message from conversation
 */
export function getLastUserMessage(turns: Turn[]): string | null {
    for (let i = turns.length - 1; i >= 0; i--) {
        if (turns[i].role === 'user' && turns[i].content) {
            return turns[i].content!;
        }
    }
    return null;
}

/**
 * Extract all user messages from conversation
 */
export function getUserMessages(turns: Turn[]): string[] {
    return turns.filter((turn) => turn.role === 'user' && turn.content).map((turn) => turn.content!);
}

/**
 * Check if conversation has any tool calls
 */
export function hasToolCalls(turns: Turn[]): boolean {
    return turns.some((turn) => turn.role === 'tool_call' || turn.role === 'tool_result');
}

/**
 * Get conversation summary (first and last user messages)
 */
export function getConversationSummary(turns: Turn[], maxLength: number = 100): string {
    const userMessages = getUserMessages(turns);

    if (userMessages.length === 0) {
        return 'Empty conversation';
    }

    if (userMessages.length === 1) {
        const message = userMessages[0];
        return message.length > maxLength ? message.substring(0, maxLength - 3) + '...' : message;
    }

    const first = userMessages[0];
    const last = userMessages[userMessages.length - 1];
    const summary = `${first} ... ${last}`;

    return summary.length > maxLength ? summary.substring(0, maxLength - 3) + '...' : summary;
}

/**
 * Append a final turn to an array of turns
 * @param turns - Existing turns
 * @param finalTurn - Turn to append
 * @returns New array with final turn appended
 */
export function appendFinalTurn(turns: Turn[], finalTurn: Turn = { role: Role.Assistant, content: '' }): Turn[] {
    return [...turns, finalTurn];
}

/**
 * Filter turns to only include user and non-empty assistant turns
 * @param linearChain - Array of messages to filter
 * @returns Filtered turns
 */
export function getFilteredTurns(linearChain: Message[]): Turn[] {
    return prepareTurns(linearChain)
        .filter((turn) => turn.role !== 'system')
        .filter((turn) => !(turn.role === 'assistant' && turn.content === ''));
}

/**
 * Generate a random request ID
 * @returns UUID string
 */
export function generateRequestId(): RequestId {
    return crypto.randomUUID();
}

/**
 * Check if a turn has content
 * @param turn - Turn to check
 * @returns True if turn has non-empty content
 */
export function turnHasContent(turn: Turn): boolean {
    return Boolean(turn.content && turn.content.trim().length > 0);
}
