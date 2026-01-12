import { decryptString } from '../crypto';
import type { AesGcmCryptoKey } from '../crypto/types';
import {
    changeConversationTitle,
    pushConversationRequest,
    updateConversationStatus,
} from '../redux/slices/core/conversations';
import {
    appendChunk,
    finishMessage,
    pushMessageRequest,
    setToolCall,
    setToolResult,
} from '../redux/slices/core/messages';
import type { LumoDispatch } from '../redux/store';
import { createGenerationError, getErrorTypeFromMessage } from '../services/errors/errorHandling';
import type { Base64, ConversationId, Message, RequestId, SpaceId, Status, Turn } from '../types';
import { ConversationStatus, Role } from '../types';
import type { GenerationToFrontendMessage } from '../types-api';
import { removeFileFromMessageContext } from './utils';

export type ContextFilter = {
    messageId: string;
    excludedFiles: string[]; // filenames to skip
};

export const ASSISTANT_TURN: Turn = {
    role: Role.Assistant,
    content: '',
};

export const ENABLE_U2L_ENCRYPTION = true;

function concat(array: (undefined | string)[]) {
    return array.filter((s) => s && s.length > 0).join('\n\n');
}

export function prepareTurns(
    linearChain: Message[],
    finalTurn = ASSISTANT_TURN,
    contextFilters: ContextFilter[] = [],
    personalizationPrompt?: string,
    projectInstructions?: string,
    documentContext?: string
): Turn[] {
    // Apply context filters to the original message chain before processing
    const filteredMessageChain = linearChain.map((message) => {
        if (!message.context) return message;

        const filter = contextFilters.find((f) => f.messageId === message.id);
        if (!filter || filter.excludedFiles.length === 0) return message;

        // Apply each file exclusion
        let filteredMessage = message;
        for (const filename of filter.excludedFiles) {
            filteredMessage = removeFileFromMessageContext(filteredMessage, filename);
        }

        return filteredMessage;
    });

    type ExtraTurn = {
        role: Role;
        content?: string;
        context?: string;
        toolCall?: string;
        toolResult?: string;
    };

    // Insert the final turn, which should be assistant normally
    let turns: ExtraTurn[] = [...filteredMessageChain, finalTurn];

    // Add RAG document context to the FIRST user message's context field (like an attachment)
    // This ensures documents are included once and won't be duplicated across turns
    if (documentContext && turns.length > 0) {
        const firstUserIndex = turns.findIndex(turn => turn.role === Role.User);
        if (firstUserIndex !== -1) {
            const userTurn = turns[firstUserIndex];
            // Prepend document context to existing context (which may have file attachments)
            const existingContext = userTurn.context || '';
            turns[firstUserIndex] = {
                ...userTurn,
                context: existingContext 
                    ? `${documentContext}\n\n${existingContext}`
                    : documentContext,
            };
            console.log('Added RAG document context to first user message context field');
        }
    }

    // Add personalization and project instructions to the LAST user message content
    // These are per-request instructions that should apply to the current question
    if ((personalizationPrompt || projectInstructions) && turns.length > 0) {
        // Find the last user message
        let lastUserIndex = -1;
        for (let i = turns.length - 1; i >= 0; i--) {
            if (turns[i].role === Role.User) {
                lastUserIndex = i;
                break;
            }
        }
        
        if (lastUserIndex !== -1) {
            const userTurn = turns[lastUserIndex];
            const originalContent = userTurn.content || '';

            // Build instruction parts
            const instructionParts: string[] = [];
            if (personalizationPrompt) {
                instructionParts.push(`[Personal context: ${personalizationPrompt}]`);
            }
            if (projectInstructions) {
                instructionParts.push(`[Project instructions: ${projectInstructions}]`);
            }

            // Prepend instructions to the user's message
            const instructionText = instructionParts.join('\n\n');
            const updatedContent = instructionText
                ? `${instructionText}\n\n${originalContent}`
                : originalContent;

            turns[lastUserIndex] = {
                ...userTurn,
                content: updatedContent,
            };

            console.log('Updated user message with instructions:', { 
                personalizationPrompt: !!personalizationPrompt, 
                projectInstructions: !!projectInstructions,
            });
        }
    }

    // Remove context and prepend it to the message content
    turns = turns.map(({ role, content, context, toolCall, toolResult }) => ({
        role,
        content: concat([context, content]),
        toolCall,
        toolResult,
    }));

    // If we see a tool call, we insert hidden turns representing tool call invocation and output.
    // If there are no tool calls, the turns will remain unchanged.
    turns = turns.flatMap(({ toolCall, toolResult, ...message }) => {
        if (toolCall || toolResult) {
            const turn1 = { role: Role.ToolCall, content: toolCall };
            const turn2 = { role: Role.ToolResult, content: toolResult };
            return [turn1, turn2, message];
        } else {
            return [message];
        }
    });

    return turns;
}

export function appendFinalTurn(turns: Turn[], finalTurn = ASSISTANT_TURN): Turn[] {
    return [...turns, finalTurn];
}

// return turns that are either user or assistant where assistant turns are not empty
export const getFilteredTurns = (
    linearChain: Message[], 
    contextFilters: ContextFilter[] = [], 
    personalizationPrompt?: string, 
    projectInstructions?: string,
    documentContext?: string
) => {
    return prepareTurns(linearChain, ASSISTANT_TURN, contextFilters, personalizationPrompt, projectInstructions, documentContext)
        .filter((turn) => {
            // Keep system messages that contain personalization, filter out other system messages
            if (turn.role === Role.System) {
                return personalizationPrompt && turn.content === personalizationPrompt;
            }
            return true;
        })
        .filter((turn) => !(turn.role === Role.Assistant && turn.content === ''));
};

async function decryptContent(
    content: Base64,
    u2lParams: { requestKey: AesGcmCryptoKey; requestId: RequestId }
): Promise<string> {
    const { requestKey, requestId } = u2lParams;
    const ad = `lumo.response.${requestId}.chunk`;
    return decryptString(content, requestKey, ad);
}

export function postProcessTitle(title: string): string {
    title = title.trim();
    const regex = /"([^"]+)"/;
    const match = title.match(regex);
    if (match) {
        title = match[1].trim();
    }
    while (title.endsWith('.')) {
        title = title.substring(0, title.length - 1);
    }
    return title;
}

// todo replace callers to use createReduxCallbacks (lib/lumo-api-client/integrations/redux.ts) and remove this function
export function getCallbacks(
    spaceId: SpaceId,
    conversationId: ConversationId,
    assistantMessageId: string,
    u2lParams?: { requestKey: AesGcmCryptoKey; requestId: RequestId }
) {
    let title = '';
    let persistedTitle: string | undefined = undefined;
    let content = '';

    // todo turn chunkCallback(message, dispatch) into dispatch(chunkCallback(message))
    const chunkCallback = async (m: GenerationToFrontendMessage, dispatch: LumoDispatch): Promise<{ error?: any }> => {
        switch (m.type) {
            case 'error':
            case 'timeout':
            case 'rejected':
            case 'harmful':
                return {
                    error: createGenerationError(getErrorTypeFromMessage(m.type), conversationId, m),
                };

            case 'ingesting':
                if (m.target !== 'message' && title) {
                    dispatch(
                        changeConversationTitle({
                            id: conversationId,
                            spaceId,
                            title: postProcessTitle(title),
                            persist: true, // todo review if this flag is still needed
                        })
                    );
                    dispatch(pushConversationRequest({ id: conversationId }));
                    persistedTitle = postProcessTitle(title);
                }
                break;

            case 'token_data':
                const substring = m.encrypted && u2lParams ? await decryptContent(m.content, u2lParams) : m.content;
                switch (m.target) {
                    case 'title':
                        title += substring;
                        dispatch(
                            changeConversationTitle({
                                id: conversationId,
                                spaceId,
                                title: postProcessTitle(title),
                                persist: false, // todo review if this flag is still needed
                            })
                        );
                        break;

                    case 'message':
                        content += substring;
                        dispatch(
                            appendChunk({
                                messageId: assistantMessageId,
                                content: substring,
                            })
                        );
                        break;

                    case 'tool_call':
                        console.log('tool call detected, dispatching setToolCall');
                        dispatch(
                            setToolCall({
                                messageId: assistantMessageId,
                                content: substring,
                            })
                        );
                        break;

                    case 'tool_result':
                        dispatch(
                            setToolResult({
                                messageId: assistantMessageId,
                                content: substring,
                            })
                        );
                        break;
                }
                break;
        }
        return {}; // No error
    };

    // todo turn finishCallback(status, dispatch) into dispatch(finishCallback(status))
    const finishCallback = async (status: Status, dispatch: LumoDispatch) => {
        dispatch(
            finishMessage({
                messageId: assistantMessageId,
                conversationId,
                spaceId,
                status,
                content: content ?? '',
                role: Role.Assistant,
            })
        );
        dispatch(pushMessageRequest({ id: assistantMessageId }));

        const finalTitle = postProcessTitle(title);
        if (title) {
            dispatch(
                changeConversationTitle({
                    id: conversationId,
                    spaceId,
                    title: finalTitle,
                    persist: true,
                })
            );
        }
        dispatch(updateConversationStatus({ id: conversationId, status: ConversationStatus.COMPLETED }));
        if (!persistedTitle || finalTitle !== persistedTitle) {
            persistedTitle = finalTitle;
            dispatch(pushConversationRequest({ id: conversationId }));
        }
    };

    return { chunkCallback, finishCallback };
}
