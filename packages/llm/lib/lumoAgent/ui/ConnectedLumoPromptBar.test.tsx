import { render } from '@testing-library/react';

import ConnectedLumoPromptBar from './ConnectedLumoPromptBar';
import LumoAgentPromptBar from './LumoAgentPromptBar';
import { focusLumoPrompt } from './focusLumoPrompt';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';
import { isAgentGenerating } from './pendingConfirm';
import type { LumoAgentItem } from './types';

vi.mock('./LumoAgentPromptBar', () => ({ default: vi.fn(() => null) }));
vi.mock('./focusLumoPrompt', () => ({ focusLumoPrompt: vi.fn() }));
vi.mock('./pendingConfirm', () => ({ isAgentGenerating: vi.fn() }));

const items: LumoAgentItem[] = [{ id: 1, kind: 'user', text: 'archive the invoices' }];

const makeDrawer = (): LumoAgentDrawerValue => ({
    items,
    isBusy: false,
    lastChainEnd: null,
    hasConversation: true,
    draft: 'archive the',
    setDraft: vi.fn(),
    send: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    stop: vi.fn(),
    clear: vi.fn(),
});

describe('ConnectedLumoPromptBar', () => {
    it('focuses itself on mount and drives the bar from the conversation', () => {
        vi.mocked(isAgentGenerating).mockReturnValue(true);
        const drawer = makeDrawer();
        const onClose = vi.fn();

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={onClose} />
            </LumoAgentDrawerContext.Provider>
        );

        expect(focusLumoPrompt).toHaveBeenCalledTimes(1);
        expect(isAgentGenerating).toHaveBeenCalledWith(items, false);
        expect(vi.mocked(LumoAgentPromptBar).mock.lastCall![0]).toEqual({
            draft: 'archive the',
            onDraftChange: drawer.setDraft,
            isGenerating: true,
            onSend: drawer.send,
            onStop: drawer.stop,
            onClose,
        });
    });

    it('stores each draft change in the conversation before telling the host', () => {
        const drawer = makeDrawer();
        const calls: string[] = [];
        vi.mocked(drawer.setDraft).mockImplementation((draft) => calls.push(`setDraft:${draft}`));
        const onDraftChange = vi.fn((draft: string) => calls.push(`host:${draft}`));

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={vi.fn()} onDraftChange={onDraftChange} />
            </LumoAgentDrawerContext.Provider>
        );
        vi.mocked(LumoAgentPromptBar).mock.lastCall![0].onDraftChange('archive the invoices');

        expect(calls).toEqual(['setDraft:archive the invoices', 'host:archive the invoices']);
    });

    it('keeps a message the host intercepts away from Lumo', () => {
        const drawer = makeDrawer();
        const interceptSend = vi.fn(() => true);

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={vi.fn()} interceptSend={interceptSend} />
            </LumoAgentDrawerContext.Provider>
        );
        vi.mocked(LumoAgentPromptBar).mock.lastCall![0].onSend('nine lives');

        expect(interceptSend).toHaveBeenCalledWith('nine lives');
        expect(drawer.send).not.toHaveBeenCalled();
    });

    it('sends a message the host does not intercept', () => {
        const drawer = makeDrawer();
        const interceptSend = vi.fn(() => false);

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={vi.fn()} interceptSend={interceptSend} />
            </LumoAgentDrawerContext.Provider>
        );
        vi.mocked(LumoAgentPromptBar).mock.lastCall![0].onSend('archive the invoices');

        expect(interceptSend).toHaveBeenCalledWith('archive the invoices');
        expect(drawer.send).toHaveBeenCalledWith('archive the invoices');
    });
});
