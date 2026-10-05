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

describe('ConnectedLumoPromptBar', () => {
    it('focuses itself on mount and drives the bar from the conversation', () => {
        jest.mocked(isAgentGenerating).mockReturnValue(true);
        const drawer: LumoAgentDrawerValue = {
            items,
            isBusy: false,
            hasConversation: true,
            draft: 'archive the',
            setDraft: jest.fn(),
            send: jest.fn(),
            confirm: jest.fn(),
            cancel: jest.fn(),
            stop: jest.fn(),
            clear: jest.fn(),
        };
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
});
