import PromptInput from '@proton/lumo-ui/PromptInput';

interface Props {
    draft: string;
    onDraftChange: (draft: string) => void;
    isGenerating: boolean;
    onSend: (text: string) => void;
    onStop: () => void;
    onClose?: () => void;
    placeholder?: string;
}

const LumoAgentPromptBar = ({ draft, onDraftChange, isGenerating, onSend, onStop, onClose, placeholder }: Props) => {
    const submit = () => {
        onDraftChange('');
        onSend(draft.trim());
    };

    return (
        <PromptInput
            value={draft}
            onChange={onDraftChange}
            onSubmit={submit}
            onStop={onStop}
            onClose={onClose}
            isGenerating={isGenerating}
            placeholder={placeholder}
        />
    );
};

export default LumoAgentPromptBar;
