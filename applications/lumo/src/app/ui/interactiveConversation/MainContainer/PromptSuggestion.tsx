import { clsx } from 'clsx';
import { c } from 'ttag';

import './PromptSuggestion.scss';

interface ThemedPromptProps {
    onClick: (prompt: string) => void;
    className?: string;
}
export const ThemedPromptSuggestion = ({ onClick, className }: ThemedPromptProps) => {
    const prompt = c('collider_2025:Prompt').t`How do people celebrate New Year's Eve around the world?`;
    const icon = '✨';

    return <PromptSuggestion prompt={prompt} icon={icon} onPromptClick={onClick} className={className} />;
};

interface PromptSuggestionProps {
    /** The text prompt to display and send */
    prompt: string;
    /** Optional emoji or icon to display before the prompt */
    icon?: string;
    /** Callback when the prompt is clicked */
    onPromptClick: (prompt: string) => void;
    className?: string;
}

const PromptSuggestion = ({ prompt, icon, onPromptClick, className }: PromptSuggestionProps) => {
    const handleClick = () => {
        onPromptClick(prompt);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
        }
    };

    return (
        <div className={clsx('prompt-suggestion', className)}>
            <button
                className="prompt-suggestion-button"
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                type="button"
                aria-label={prompt}
            >
                {icon && <span className="prompt-suggestion-icon">{icon}</span>}
                <span className="prompt-suggestion-text">{prompt}</span>
            </button>
        </div>
    );
};

export default PromptSuggestion;
