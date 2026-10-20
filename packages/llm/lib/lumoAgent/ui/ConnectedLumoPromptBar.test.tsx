import { render } from '@testing-library/react';

import ConnectedLumoPromptBar from './ConnectedLumoPromptBar';
import LumoAgentPromptBar from './LumoAgentPromptBar';
import { focusLumoPrompt } from './focusLumoPrompt';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';
import { isAgentGenerating } from './pendingConfirm';
import type { LumoAgentItem } from './types';

jest.mock('./LumoAgentPromptBar', () => ({ __esModule: true, default: jest.fn(() => null) }));
jest.mock('./focusLumoPrompt', () => ({ focusLumoPrompt: jest.fn() }));
jest.mock('./pendingConfirm', () => ({ isAgentGenerating: jest.fn() }));

const items: LumoAgentItem[] = [{ id: 1, kind: 'user', text: 'archive the invoices' }];

const makeDrawer = (): LumoAgentDrawerValue => ({
    items,
    isBusy: false,
    lastChainEnd: null,
    hasConversation: true,
    draft: 'archive the',
    setDraft: jest.fn(),
    send: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    stop: jest.fn(),
    clear: jest.fn(),
});

describe('ConnectedLumoPromptBar', () => {
    it('focuses itself on mount and drives the bar from the conversation', () => {
        jest.mocked(isAgentGenerating).mockReturnValue(true);
        const drawer = makeDrawer();
        const onClose = jest.fn();

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={onClose} />
            </LumoAgentDrawerContext.Provider>
        );

        expect(focusLumoPrompt).toHaveBeenCalledTimes(1);
        expect(isAgentGenerating).toHaveBeenCalledWith(items, false);
        expect(jest.mocked(LumoAgentPromptBar).mock.lastCall![0]).toEqual({
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
        jest.mocked(drawer.setDraft).mockImplementation((draft) => calls.push(`setDraft:${draft}`));
        const onDraftChange = jest.fn((draft: string) => calls.push(`host:${draft}`));

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoPromptBar onClose={jest.fn()} onDraftChange={onDraftChange} />
            </LumoAgentDrawerContext.Provider>
        );
        jest.mocked(LumoAgentPromptBar).mock.lastCall![0].onDraftChange('archive the invoices');

        expect(calls).toEqual(['setDraft:archive the invoices', 'host:archive the invoices']);
    });
});
