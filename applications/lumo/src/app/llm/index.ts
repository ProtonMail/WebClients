import { decryptString } from '../crypto';
import type { AesGcmCryptoKey } from '../crypto/types';
import { createImageAttachment, generateImageMarkdown } from '../lib/imageAttachment';
import { addAttachment, pushAttachmentRequest } from '../redux/slices/core/attachments';
import {
    changeConversationTitle,
    pushConversationRequest,
    updateConversationStatus,
} from '../redux/slices/core/conversations';
import {
    addImageAttachment,
    appendChunk,
    finishMessage,
    pushMessageRequest,
    setToolCall,
    setToolResult,
} from '../redux/slices/core/messages';
import type { PersonalizationSettings } from '../redux/slices/personalization';
import type { LumoDispatch } from '../redux/store';
import { createGenerationError, getErrorTypeFromMessage } from '../services/errors/errorHandling';
import {
    type Attachment,
    type Base64,
    type ConversationId,
    ConversationStatus,
    type Message,
    type RequestId,
    Role,
    type ShallowAttachment,
    type SpaceId,
    type Status,
    type Turn,
} from '../types';
import type { GenerationResponseMessage, WireImage } from '../types-api';
import { type ConversationContext, formatPersonalization } from '../ui/interactiveConversation/helper';
import { separateAttachmentsByType } from './attachments';

export type ContextFilter = {
    messageId: string;
    excludedFiles: string[]; // filenames to skip
};

export const EMPTY_ASSISTANT_TURN: Turn = {
    role: Role.Assistant,
    content: '',
};

export const ENABLE_U2L_ENCRYPTION = true;

// Internal type for turns during processing (before final cleanup)
type TurnInProgress = Turn & {
    attachments?: ShallowAttachment[];
    context?: string;
    toolCall?: string;
    toolResult?: string;
};

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(buffer: Uint8Array<ArrayBuffer>): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

/**
 * Convert image attachment to WireImage format
 */
function attachmentToWireImage(attachment: Attachment): WireImage {
    if (!attachment.data) {
        throw new Error(`Attachment ${attachment.id} has no data`);
    }
    return {
        encrypted: false, // Will be set during encryption phase
        image_id: attachment.id,
        data: uint8ArrayToBase64(attachment.data),
    };
}

export function prepareTurns(
    linearChain: Message[],
    contextFilters: ContextFilter[] = [], // todo remove - it is included in `c`
    personalization: PersonalizationSettings,
    projectInstructions?: string,
    documentContext?: string,
    c?: ConversationContext
): Turn[] {
    // Step 1: Transform messages to turns with filtered attachments
    let turns: TurnInProgress[] = linearChain.map((message) => ({
        role: message.role,
        content: message.content, // Just the typed message, NOT message.context
        toolCall: message.toolCall,
        toolResult: message.toolResult,
        attachments: filterMessageAttachments(message.attachments, message.id, c?.contextFilters ?? []),
    }));

    // Step 2: Expand attachments into separate turns (one turn per attachment)
    if (c?.allConversationAttachments) {
        turns = turns.flatMap((turn) => expandAttachmentsIntoTurns(turn, c.allConversationAttachments));
    }

    // Step 3: Insert the final empty assistant turn
    turns.push(EMPTY_ASSISTANT_TURN);

    // Step 4.1: Add RAG document context to the FIRST user message's context field (like an attachment)
    // This ensures documents are included once and won't be duplicated across turns
    if (documentContext && turns.length > 0) {
        const firstUserIndex = turns.findIndex((turn) => turn.role === Role.User);
        if (firstUserIndex !== -1) {
            const userTurn = turns[firstUserIndex];
            // Prepend document context to existing context (which may have file attachments)
            const existingContext = userTurn.context || '';
            turns[firstUserIndex] = {
                ...userTurn,
                context: existingContext ? `${documentContext}\n\n${existingContext}` : documentContext,
            };
            console.log('Added RAG document context to first user message context field');
        }
    }

    // Step 4.2: Add personalization to the last user message
    // These are per-request instructions that should apply to the current question
    const personalizationPrompt = formatPersonalization(personalization);
    if (personalizationPrompt || projectInstructions) {
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
            // todo: use injectPersonalization() instead
            const instructionParts: string[] = [];
            if (personalizationPrompt) {
                instructionParts.push(`[Personal context: ${personalizationPrompt}]`);
            }
            if (projectInstructions) {
                instructionParts.push(`[Project instructions: ${projectInstructions}]`);
            }

            // Prepend instructions to the user's message
            const instructionText = instructionParts.join('\n\n');
            const updatedContent = instructionText ? `${instructionText}\n\n${originalContent}` : originalContent;

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

    // Step 5: Expand tool calls into separate turns (if any)
    turns = turns.flatMap(({ toolCall, toolResult, images, ...turn }) => {
        const baseTurn = { ...turn, ...(images && { images }) };
        if (!toolCall && !toolResult) return [baseTurn];

        const tcTurn = { role: Role.ToolCall, content: toolCall };
        const trTurn = { role: Role.ToolResult, content: toolResult };
        return [tcTurn, trTurn, baseTurn];
    });

    // Step 6: Remove empty assistant turns
    turns = removeEmptyAssistantTurns(turns);

    return turns;
}

function removeEmptyAssistantTurns(turns: Turn[]) {
    return (
        turns
            // .filter((turn) => {
            //     // Keep system messages that contain personalization, filter out other system messages
            //     if (turn.role === Role.System) {
            //         return personalizationPrompt && turn.content === personalizationPrompt;
            //     }
            //     return true;
            // })
            .filter((turn) => !(turn.role === Role.Assistant && turn.content === ''))
    );
}

/**
 * Safely convert attachment to WireImage, returning null on error
 */
function tryConvertToWireImage(attachment: Attachment): WireImage | null {
    try {
        return attachmentToWireImage(attachment);
    } catch (error) {
        console.error(`Failed to convert attachment ${attachment.id} to WireImage:`, error);
        return null;
    }
}

/**
 * Format a single text attachment for LLM context
 */
function formatTextAttachmentContent(attachment: Attachment): string {
    const filename = `Filename: ${attachment.filename}`;
    const header = 'File contents:';
    const beginMarker = '----- BEGIN FILE CONTENTS -----';
    const endMarker = '----- END FILE CONTENTS -----';
    const content = attachment.markdown?.trim() || '';

    return [filename, header, beginMarker, content, endMarker].join('\n');
}

/**
 * Create a turn for an attachment (either text or image)
 */
function createAttachmentTurn(shallowAtt: ShallowAttachment, allAttachments: Attachment[]): Turn | null {
    const fullAtt = allAttachments.find((a) => a.id === shallowAtt.id);
    if (!fullAtt) return null;

    const { imageAttachments, textAttachments } = separateAttachmentsByType([fullAtt]);

    if (imageAttachments.length > 0) {
        // Image attachment turn
        const wireImage = tryConvertToWireImage(fullAtt);
        if (!wireImage) return null;

        return {
            role: Role.User,
            content: `[Image: ${shallowAtt.filename}]`,
            images: [wireImage],
        };
    } else if (textAttachments.length > 0) {
        // Text attachment turn
        return {
            role: Role.User,
            content: formatTextAttachmentContent(fullAtt),
        };
    }

    return null;
}

/**
 * Filter attachments by removing excluded files based on context filters
 */
function filterMessageAttachments(
    attachments: ShallowAttachment[] | undefined,
    messageId: string,
    contextFilters: ContextFilter[]
): ShallowAttachment[] | undefined {
    if (!attachments || attachments.length === 0) return attachments;

    const filter = (contextFilters ?? []).find((f) => f.messageId === messageId);
    if (!filter || filter.excludedFiles.length === 0) return attachments;

    return attachments.filter((att) => !filter.excludedFiles.includes(att.filename));
}

/**
 * Expand a turn with attachments into multiple turns (one per attachment + content)
 * Similar to how tool calls are expanded into separate turns
 */
function expandAttachmentsIntoTurns(turn: TurnInProgress, allAttachments: Attachment[]): Turn[] {
    const { attachments, ...baseTurn } = turn;

    // No attachments or not a user message? Return as-is
    if (turn.role !== Role.User || !attachments || attachments.length === 0) {
        return [baseTurn];
    }

    // Create a turn for each attachment
    const attachmentTurns = attachments
        .map((att) => createAttachmentTurn(att, allAttachments))
        .filter((t): t is Turn => t !== null);

    // Return: attachments first, then user's message content
    return [...attachmentTurns, baseTurn];
}

export function appendFinalTurn(turns: Turn[], finalTurn = EMPTY_ASSISTANT_TURN): Turn[] {
    return [...turns, finalTurn];
}

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
// todo unused? consider removing
export function _getCallbacks(
    spaceId: SpaceId,
    conversationId: ConversationId,
    assistantMessageId: string,
    u2lParams?: { requestKey: AesGcmCryptoKey; requestId: RequestId }
) {
    let title = '';
    let persistedTitle: string | undefined = undefined;
    let content = '';

    // todo turn chunkCallback(message, dispatch) into dispatch(chunkCallback(message))
    const chunkCallback = async (m: GenerationResponseMessage, dispatch: LumoDispatch): Promise<{ error?: any }> => {
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

            case 'image_data':
                console.log('[IMAGE_DATA] Received in chunkCallback', {
                    image_id: m.image_id,
                    data: m.data ? `${m.data.substring(0, 50)}... (${m.data.length} chars)` : 'none',
                    is_final: m.is_final,
                    seed: m.seed,
                });

                if (m.image_id && m.data) {
                    const { attachment, data: imageData } = createImageAttachment(m.image_id, m.data, spaceId);

                    dispatch(addAttachment({ ...attachment, data: imageData }));
                    dispatch(addImageAttachment({ messageId: assistantMessageId, attachment }));
                    dispatch(
                        appendChunk({ messageId: assistantMessageId, content: generateImageMarkdown(m.image_id) })
                    );
                    // Push attachment to server now that it has spaceId
                    dispatch(pushAttachmentRequest({ id: m.image_id }));
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

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function injectPersonalization(turn: Turn, personalization: PersonalizationSettings): Turn {
    const personalizationPrompt = formatPersonalization(personalization);
    if (!personalizationPrompt) return turn;
    const originalContent = turn.content || '';
    const updatedContent = originalContent
        ? `${originalContent}\n\n[Personal context: ${personalizationPrompt}]`
        : `[Personal context: ${personalizationPrompt}]`;
    return {
        ...turn,
        content: updatedContent,
    };
}
