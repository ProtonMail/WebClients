import { fireEvent, render, screen } from '@testing-library/react';

import { LumoConversationHeaderActions, getConversationActions } from './LumoConversationHeaderActions';

const actionLabels = (actions: ReturnType<typeof getConversationActions>) => {
    return actions.map(({ label }) => label);
};

describe('getConversationActions', () => {
    it('offers report then new chat when the host supplied a composer', () => {
        const openDebugReport = vi.fn();
        const clear = vi.fn();
        const actions = getConversationActions({ hasConversation: true, clear, openDebugReport });

        expect(actionLabels(actions)).toEqual(['Report a problem', 'New chat']);
        expect(actions.map(({ onClick }) => onClick)).toEqual([openDebugReport, clear]);
    });

    it('offers only new chat to a host with no composer', () => {
        const actions = getConversationActions({ hasConversation: true, clear: vi.fn() });

        expect(actionLabels(actions)).toEqual(['New chat']);
    });

    it('offers nothing before there is a conversation', () => {
        const actions = getConversationActions({
            hasConversation: false,
            clear: vi.fn(),
            openDebugReport: vi.fn(),
        });

        expect(actions).toEqual([]);
    });
});

describe('LumoConversationHeaderActions', () => {
    it('renders each shared action as a button wired to its handler', () => {
        const openDebugReport = vi.fn();
        render(<LumoConversationHeaderActions hasConversation clear={vi.fn()} openDebugReport={openDebugReport} />);

        fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));

        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(openDebugReport).toHaveBeenCalledTimes(1);
    });
});
