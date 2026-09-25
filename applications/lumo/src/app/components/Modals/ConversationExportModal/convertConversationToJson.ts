import { getMessageContent } from '../../../messageHelpers';
import type { MessageMap } from '../../../redux/slices/core/messages';
import type { Conversation } from '../../../types';
import { Role } from '../../../types';

/** ChatGPT roots every message tree at this synthetic, message-less node. */
export const CONVERSATION_ROOT_NODE_ID = 'client-created-root';

/** Converts a date string to fractional unix seconds — the unit ChatGPT timestamps use, not the milliseconds. */
const toUnixSeconds = (date: string) => new Date(date).getTime() / 1000;

/** Converts a Lumo author role to ChatGPT's author role. */
const convertRole = (role: Role): string => {
    switch (role) {
        case Role.Assistant:
            return 'assistant';
        case Role.System:
            return 'system';
        case Role.ToolCall:
        case Role.ToolResult:
            // Lumo tracks tool traffic as separate `tool_call`/`tool_result` roles; ChatGPT collapses both into one
            // `tool` author
            return 'tool';
        case Role.User:
            return 'user';
    }
};

/**
 * Converts a Lumo conversation into structured JSON for export, aiming to match ChatGPT's conversation export format as
 * closely as possible for maximized compatibility.
 */
export const convertConversationToJson = (conversation: Conversation, messages: MessageMap): string => {
    let currentNodeId = null;
    let currentNodeTime = 0;

    // Transforms Lumo's message tree to match ChatGPT's structure as closely as possible.
    const mapping = Object.values(messages)
        .filter((message) => !message.placeholder)
        .reduce(
            (acc, message) => {
                const createTime = toUnixSeconds(message.createdAt);

                if (createTime > currentNodeTime) {
                    currentNodeTime = createTime;
                    currentNodeId = message.id;
                }

                // Top-level messages have no parentId in Lumo; attach them to the synthetic root node so every
                // entry in `mapping` has a parent, matching ChatGPT's tree structure.
                const parentId = message.parentId ?? CONVERSATION_ROOT_NODE_ID;

                acc[message.id] = {
                    id: message.id,
                    message: {
                        author: {
                            name: null,
                            role: convertRole(message.role),
                        },
                        content: {
                            content_type: 'text',
                            parts: [getMessageContent(message)],
                        },
                        create_time: createTime,
                        id: message.id,
                        metadata: {
                            model_slug: message.requestedModel,
                            parent_id: parentId,
                            status: message.status,
                        },
                    },
                    parent: parentId,
                };
                return acc;
            },
            {
                [CONVERSATION_ROOT_NODE_ID]: {
                    id: CONVERSATION_ROOT_NODE_ID,
                    message: null,
                    parent: null,
                },
            } as { [id: string]: object }
        );

    const data = {
        conversation_id: conversation.id,
        create_time: toUnixSeconds(conversation.createdAt),
        current_node: currentNodeId,
        id: conversation.id,
        is_starred: conversation.starred ?? false,
        mapping,
        title: conversation.title,
        update_time: toUnixSeconds(conversation.updatedAt),
    };

    return JSON.stringify(data);
};
