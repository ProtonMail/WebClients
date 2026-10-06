import LumoAgentPanel from './LumoAgentPanel';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';

import '@proton/lumo-ui/lumo-ui.scss';

import './lumoAgent.scss';

interface Props {
    onClose: () => void;
    showPromptInput?: boolean;
}

const ConnectedLumoAgentPanel = ({ onClose, showPromptInput }: Props) => {
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
