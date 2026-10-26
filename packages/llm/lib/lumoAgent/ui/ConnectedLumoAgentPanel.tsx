import LumoAgentPanel from './LumoAgentPanel';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';

import '@proton/lumo-ui/lumo-ui.scss';

import './lumoAgent.scss';

interface Props {
    onClose: () => void;
    showPromptInput?: boolean;
    showThinking?: boolean;
    showIdleMark?: boolean;
}

const ConnectedLumoAgentPanel = ({ onClose, showPromptInput, showThinking, showIdleMark }: Props) => {
    const {
        items,
        isBusy,
        cardRenderers,
        serverToolMeta,
        suggestions,
        draft,
        setDraft,
        send,
        stop,
        confirm,
        cancel,
        onSuggestionPicked,
    } = useLumoAgentDrawer();

    return (
        <LumoAgentPanel
            draft={draft}
            onDraftChange={setDraft}
            items={items}
            isBusy={isBusy}
            cardRenderers={cardRenderers}
            serverToolMeta={serverToolMeta}
            suggestions={suggestions}
            showPromptInput={showPromptInput}
            showThinking={showThinking}
            showIdleMark={showIdleMark}
            onSend={send}
            onSuggestionPicked={onSuggestionPicked}
            onStop={stop}
            onClose={onClose}
            onConfirm={confirm}
            onCancel={cancel}
        />
    );
};

export default ConnectedLumoAgentPanel;
