import { render } from '@testing-library/react';

import ConnectedLumoAgentPanel from './ConnectedLumoAgentPanel';
import LumoAgentPanel from './LumoAgentPanel';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';

vi.mock('./LumoAgentPanel', () => ({ default: vi.fn(() => null) }));

describe('ConnectedLumoAgentPanel', () => {
    it('hands the conversation and the host callbacks to the panel', () => {
        const drawer: LumoAgentDrawerValue = {
            items: [],
            isBusy: true,
            lastChainEnd: null,
            hasConversation: false,
            draft: 'archive the',
            setDraft: vi.fn(),
            send: vi.fn(),
            confirm: vi.fn(),
            cancel: vi.fn(),
            stop: vi.fn(),
            clear: vi.fn(),
            onSuggestionPicked: vi.fn(),
            cardRenderers: {},
            serverToolMeta: {},
            suggestions: [],
        };
        const onClose = vi.fn();

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoAgentPanel
                    onClose={onClose}
                    showPromptInput={false}
                    showThinking={false}
                    showIdleMark={false}
                />
            </LumoAgentDrawerContext.Provider>
        );

        expect(vi.mocked(LumoAgentPanel).mock.lastCall![0]).toEqual({
            draft: 'archive the',
            onDraftChange: drawer.setDraft,
            items: drawer.items,
            isBusy: true,
            cardRenderers: drawer.cardRenderers,
            serverToolMeta: drawer.serverToolMeta,
            suggestions: drawer.suggestions,
            showPromptInput: false,
            showThinking: false,
            showIdleMark: false,
            onSend: drawer.send,
            onSuggestionPicked: drawer.onSuggestionPicked,
            onStop: drawer.stop,
            onClose,
            onConfirm: drawer.confirm,
            onCancel: drawer.cancel,
        });
    });
});
