import { renderHook } from '@testing-library/react';

import { useConversationAgent } from '../../../hooks/useConversationAgent';
import { useCustomAgents } from '../../../hooks/useCustomAgents';
import {
    onNativeClearCustomLumo,
    onNativeSelectCustomLumo,
    setNativeCustomLumos,
    setNativeSelectedCustomLumo,
} from '../../../remote/nativeComposerBridgeHelpers';
import { useNativeComposerCustomLumoApi } from './useNativeComposerCustomLumoApi';

jest.mock('../../../hooks/useCustomAgents');
jest.mock('../../../hooks/useConversationAgent');
jest.mock('../../../remote/nativeComposerBridgeHelpers');

const mockedUseCustomAgents = useCustomAgents as jest.Mock;
const mockedUseConversationAgent = useConversationAgent as jest.Mock;
const mockedOnNativeSelectCustomLumo = onNativeSelectCustomLumo as jest.Mock;
const mockedOnNativeClearCustomLumo = onNativeClearCustomLumo as jest.Mock;

describe('useNativeComposerCustomLumoApi', () => {
    const activateAgent = jest.fn();
    const clearAgent = jest.fn();
    const personalAgent = { id: 'p1', name: 'Mine', source: 'personal' as const, createdAt: 0, updatedAt: 0 };
    const protonAgent = { id: 'b1', name: 'Built-in', source: 'published' as const, createdAt: 0, updatedAt: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseCustomAgents.mockReturnValue({ personalAgents: [personalAgent], protonAgents: [protonAgent] });
        mockedUseConversationAgent.mockReturnValue({
            activeAgent: undefined,
            activeAgentId: undefined,
            activateAgent,
            clearAgent,
        });
        mockedOnNativeSelectCustomLumo.mockReturnValue(jest.fn());
        mockedOnNativeClearCustomLumo.mockReturnValue(jest.fn());
    });

    it('pushes the combined built-in + personal list when enabled', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        expect(setNativeCustomLumos).toHaveBeenCalledWith([
            { id: 'b1', name: 'Built-in', icon: 'robot', description: undefined, source: 'published' },
            { id: 'p1', name: 'Mine', icon: 'robot', description: undefined, source: 'personal' },
        ]);
    });

    it('pushes an empty list and null selection when disabled', () => {
        mockedUseConversationAgent.mockReturnValue({
            activeAgent: personalAgent,
            activeAgentId: 'p1',
            activateAgent,
            clearAgent,
        });

        renderHook(() => useNativeComposerCustomLumoApi('conv-1', false));

        expect(setNativeCustomLumos).toHaveBeenCalledWith([]);
        expect(setNativeSelectedCustomLumo).toHaveBeenCalledWith(null);
    });

    it('pushes the full active Custom Lumo (not just its id) when enabled', () => {
        mockedUseConversationAgent.mockReturnValue({
            activeAgent: personalAgent,
            activeAgentId: 'p1',
            activateAgent,
            clearAgent,
        });

        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        expect(setNativeSelectedCustomLumo).toHaveBeenCalledWith({
            id: 'p1',
            name: 'Mine',
            icon: 'robot',
            description: undefined,
            source: 'personal',
        });
    });

    it('pushes a null selection when enabled but nothing is active', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        expect(setNativeSelectedCustomLumo).toHaveBeenCalledWith(null);
    });

    it('activates the agent when a known id is selected from native', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        const handler = mockedOnNativeSelectCustomLumo.mock.calls[0][0];
        handler({ detail: { id: 'p1' } });

        expect(activateAgent).toHaveBeenCalledWith('p1');
    });

    it('ignores an unknown id selected from native', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        const handler = mockedOnNativeSelectCustomLumo.mock.calls[0][0];
        handler({ detail: { id: 'unknown' } });

        expect(activateAgent).not.toHaveBeenCalled();
    });

    it('clears the agent when native requests clear', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', true));

        const handler = mockedOnNativeClearCustomLumo.mock.calls[0][0];
        handler();

        expect(clearAgent).toHaveBeenCalled();
    });

    it('does not subscribe to native events when disabled', () => {
        renderHook(() => useNativeComposerCustomLumoApi('conv-1', false));

        expect(onNativeSelectCustomLumo).not.toHaveBeenCalled();
        expect(onNativeClearCustomLumo).not.toHaveBeenCalled();
    });
});
