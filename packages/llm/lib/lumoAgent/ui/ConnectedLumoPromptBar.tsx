import { useEffect } from 'react';

import LumoAgentPromptBar from './LumoAgentPromptBar';
import { focusLumoPrompt } from './focusLumoPrompt';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';
import { isAgentGenerating } from './pendingConfirm';

import '@proton/lumo-ui/lumo-ui.scss';

import './lumoAgent.scss';

interface Props {
    onClose: () => void;
}

const ConnectedLumoPromptBar = ({ onClose }: Props) => {
    const { items, isBusy, draft, setDraft, send, stop } = useLumoAgentDrawer();

    useEffect(focusLumoPrompt, []);

    return (
        <LumoAgentPromptBar
            draft={draft}
            onDraftChange={setDraft}
            isGenerating={isAgentGenerating(items, isBusy)}
            onSend={send}
            onStop={stop}
            onClose={onClose}
        />
    );
};

export default ConnectedLumoPromptBar;
