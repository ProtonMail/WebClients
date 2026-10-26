import type { KeyboardEvent } from 'react';

import ConnectedLumoAgentPanel from '@proton/llm/lib/lumoAgent/ui/ConnectedLumoAgentPanel';

interface Props {
    onClose: () => void;
}

const LumoFloatingPanelCard = ({ onClose }: Props) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') {
            return;
        }
        event.stopPropagation();
        onClose();
    };

    return (
        // Escape is handled on the card, so it only closes while focus is inside it
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className="lumo-floating-panel-card flex flex-column flex-nowrap rounded-xl overflow-hidden"
            onKeyDown={handleKeyDown}
        >
            <div className="flex flex-column flex-nowrap flex-1 lumo-floating-panel-card-body">
                {/* The cat on screen stands in for the in-chat thinking row and the idle mark */}
                <ConnectedLumoAgentPanel
                    onClose={onClose}
                    showPromptInput={false}
                    showThinking={false}
                    showIdleMark={false}
                />
            </div>
        </div>
    );
};

export default LumoFloatingPanelCard;
