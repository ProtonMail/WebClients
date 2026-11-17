import { fireEvent, render, screen } from '@testing-library/react';

import LumoAgentPromptBar from './LumoAgentPromptBar';

describe('LumoAgentPromptBar', () => {
    it('sends the trimmed draft and empties it', () => {
        const onSend = vi.fn();
        const onDraftChange = vi.fn();
        render(
            <LumoAgentPromptBar
                draft="  find my invoices  "
                onDraftChange={onDraftChange}
                isGenerating={false}
                onSend={onSend}
                onStop={vi.fn()}
            />
        );

        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

        expect(onSend).toHaveBeenCalledWith('find my invoices');
        expect(onDraftChange).toHaveBeenCalledWith('');
    });

    it('reports typing to the host that holds the draft', () => {
        const onDraftChange = vi.fn();
        render(
            <LumoAgentPromptBar
                draft=""
                onDraftChange={onDraftChange}
                isGenerating={false}
                onSend={vi.fn()}
                onStop={vi.fn()}
            />
        );

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'archive the' } });

        expect(onDraftChange).toHaveBeenCalledWith('archive the');
    });
});
