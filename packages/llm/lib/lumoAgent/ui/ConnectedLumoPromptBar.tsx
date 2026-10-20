import { useEffect } from 'react';

import LumoAgentPromptBar from './LumoAgentPromptBar';
import { focusLumoPrompt } from './focusLumoPrompt';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';
import { isAgentGenerating } from './pendingConfirm';

import '@proton/lumo-ui/lumo-ui.scss';

import './lumoAgent.scss';

interface Props {
    onClose: () => void;
    /** Observes each draft change after the conversation has stored it. */
    onDraftChange?: (draft: string) => void;
}

const ConnectedLumoPromptBar = ({ onClose, onDraftChange }: Props) => {
    const { items, isBusy, draft, setDraft, send, stop } = useLumoAgentDrawer();

    useEffect(focusLumoPrompt, []);

    const changeDraft = onDraftChange
        ? (nextDraft: string) => {
              setDraft(nextDraft);
              onDraftChange(nextDraft);
          }
        : setDraft;

    return (
        <LumoAgentPromptBar
            draft={draft}
            onDraftChange={changeDraft}
            isGenerating={isAgentGenerating(items, isBusy)}
            onSend={send}
            onStop={stop}
            onClose={onClose}
        />
    );
};

export default ConnectedLumoPromptBar;
