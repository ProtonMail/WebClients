import { useCallback, useMemo } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { sanitizeConversationStarters } from '../features/agents/constants';
import { getDefaultAgents } from '../features/agents/defaultAgents';
import { findAgentById } from '../features/agents/registry';
import { useLumoSelector } from '../redux/hooks';
import type { CustomAgent } from '../redux/slices/lumoUserSettings';
import { useLumoUserSettings } from './useLumoUserSettings';

export type CustomAgentDraft = {
    name: string;
    instructions?: string;
    description?: string;
    icon?: string;
    hidden?: boolean;
    conversationStarters?: string[];
};

/**
 * CRUD helpers for personal custom agents. Agents are small persona definitions
 * stored directly in the encrypted, remote-synced LumoUserSettings object.
 */
export function useCustomAgents() {
    const { updateSettings } = useLumoUserSettings();
    // Personal agents authored by the user (stored in settings).
    const personalAgents = useLumoSelector((state) => state.lumoUserSettings.customAgents) ?? [];
    // Built-in, Proton-published agents (code-shipped, read-only).
    const protonAgents = useMemo(() => getDefaultAgents(), []);

    const persist = useCallback(
        (next: CustomAgent[]) => {
            updateSettings({ customAgents: next, _autoSave: true });
        },
        [updateSettings]
    );

    const createAgent = useCallback(
        (draft: CustomAgentDraft): CustomAgent => {
            const now = Date.now();
            const agent: CustomAgent = {
                id: uuidv4(),
                name: draft.name.trim(),
                instructions: draft.instructions?.trim() || undefined,
                description: draft.description?.trim() || undefined,
                icon: draft.icon,
                hidden: draft.hidden || undefined,
                conversationStarters: sanitizeConversationStarters(draft.conversationStarters),
                source: 'personal',
                createdAt: now,
                updatedAt: now,
            };
            persist([...personalAgents, agent]);
            return agent;
        },
        [personalAgents, persist]
    );

    const updateAgent = useCallback(
        (id: string, draft: CustomAgentDraft) => {
            persist(
                personalAgents.map((agent) =>
                    agent.id === id
                        ? {
                              ...agent,
                              name: draft.name.trim(),
                              instructions: draft.instructions?.trim() || undefined,
                              description: draft.description?.trim() || undefined,
                              icon: draft.icon,
                              hidden: draft.hidden || undefined,
                              conversationStarters: sanitizeConversationStarters(draft.conversationStarters),
                              updatedAt: Date.now(),
                          }
                        : agent
                )
            );
        },
        [personalAgents, persist]
    );

    const deleteAgent = useCallback(
        (id: string) => {
            persist(personalAgents.filter((agent) => agent.id !== id));
        },
        [personalAgents, persist]
    );

    // Lookup spans both built-in and personal agents.
    const getAgent = useCallback((id: string | undefined) => findAgentById(id, personalAgents), [personalAgents]);

    return { personalAgents, protonAgents, createAgent, updateAgent, deleteAgent, getAgent };
}
