import { useEffect, useMemo } from 'react';

import { findAgentById } from '../../../features/agents/registry';
import { useConversationAgent } from '../../../hooks/useConversationAgent';
import { useCustomAgents } from '../../../hooks/useCustomAgents';
import {
    onNativeClearCustomLumo,
    onNativeSelectCustomLumo,
    setNativeCustomLumos,
    setNativeSelectedCustomLumo,
} from '../../../remote/nativeComposerBridgeHelpers';
import { toCustomLumo, toCustomLumos } from './toCustomLumos';

/**
 * Bridges the "Custom Lumos" agent picker to native: pushes the available list and the
 * active selection, and forwards native select/clear taps into the same
 * `activateAgent`/`clearAgent` the web picker uses. `enabled` should reflect
 * `canUseAgents` (same guard hiding `ComposerAgentBar`/`AgentPickerModal` on web) so
 * guests/projects never see the list.
 */
export const useNativeComposerCustomLumoApi = (conversationId: string | undefined, enabled: boolean) => {
    const { personalAgents, protonAgents } = useCustomAgents();
    const { activeAgent, activeAgentId, activateAgent, clearAgent } = useConversationAgent(conversationId);

    const list = useMemo(
        () => (enabled ? toCustomLumos([...protonAgents, ...personalAgents], activeAgentId) : []),
        [enabled, protonAgents, personalAgents, activeAgentId]
    );

    const selectedCustomLumo = useMemo(
        () => (enabled && activeAgent ? toCustomLumo(activeAgent) : null),
        [enabled, activeAgent]
    );

    useEffect(() => {
        setNativeCustomLumos(list);
    }, [list]);

    useEffect(() => {
        setNativeSelectedCustomLumo(selectedCustomLumo);
    }, [selectedCustomLumo]);

    useEffect(() => {
        if (!enabled) {
            return;
        }
        const unsubscribeSelect = onNativeSelectCustomLumo((e) => {
            const { id } = e.detail;
            if (findAgentById(id, personalAgents)) {
                activateAgent(id);
            }
        });
        const unsubscribeClear = onNativeClearCustomLumo(() => {
            clearAgent();
        });
        return () => {
            unsubscribeSelect();
            unsubscribeClear();
        };
    }, [enabled, personalAgents, activateAgent, clearAgent]);
};
