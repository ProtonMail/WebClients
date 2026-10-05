import { render } from '@testing-library/react';

import ConnectedLumoAgentPanel from './ConnectedLumoAgentPanel';
import LumoAgentPanel from './LumoAgentPanel';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';

jest.mock('./LumoAgentPanel', () => ({ __esModule: true, default: jest.fn(() => null) }));

describe('ConnectedLumoAgentPanel', () => {
    it('hands the conversation and the host callbacks to the panel', () => {
        const drawer: LumoAgentDrawerValue = {
            items: [],
            isBusy: true,
            hasConversation: false,
            draft: 'archive the',
            setDraft: jest.fn(),
            send: jest.fn(),
            confirm: jest.fn(),
            cancel: jest.fn(),
            stop: jest.fn(),
            clear: jest.fn(),
            onSuggestionPicked: jest.fn(),
            cardRenderers: {},
            serverToolMeta: {},
            suggestions: [],
        };
        const onClose = jest.fn();

        render(
            <LumoAgentDrawerContext.Provider value={drawer}>
                <ConnectedLumoAgentPanel onClose={onClose} showPromptInput={false} />
            </LumoAgentDrawerContext.Provider>
        );

        expect(jest.mocked(LumoAgentPanel).mock.lastCall![0]).toEqual({
            draft: 'archive the',
            onDraftChange: drawer.setDraft,
            items: drawer.items,
            isBusy: true,
            cardRenderers: drawer.cardRenderers,
            serverToolMeta: drawer.serverToolMeta,
            suggestions: drawer.suggestions,
            showPromptInput: false,
            onSend: drawer.send,
            onSuggestionPicked: drawer.onSuggestionPicked,
            onStop: drawer.stop,
            onClose,
            onConfirm: drawer.confirm,
            onCancel: drawer.cancel,
        });
    });
});
