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
    /** Returns true when the host has handled the message itself, so it never reaches Lumo. */
    interceptSend?: (message: string) => boolean;
}

const ConnectedLumoPromptBar = ({ onClose, onDraftChange, interceptSend }: Props) => {
    const { items, isBusy, draft, setDraft, send, stop } = useLumoAgentDrawer();

    useEffect(focusLumoPrompt, []);

    const changeDraft = onDraftChange
        ? (nextDraft: string) => {
              setDraft(nextDraft);
              onDraftChange(nextDraft);
          }
        : setDraft;

    const sendUnlessIntercepted = interceptSend
        ? (message: string) => {
              if (!interceptSend(message)) {
                  send(message);
              }
          }
        : send;

    return (
        <LumoAgentPromptBar
            draft={draft}
            onDraftChange={changeDraft}
            isGenerating={isAgentGenerating(items, isBusy)}
            onSend={sendUnlessIntercepted}
            onStop={stop}
            onClose={onClose}
        />
    );
};

export default ConnectedLumoPromptBar;
