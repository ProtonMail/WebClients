import { clsx } from 'clsx';

/**
 * Suggested prompts ("conversation starters") for the active agent, shown by the composer on a
 * fresh conversation. Clicking a chip sends that prompt immediately, mirroring the GPT-style
 * starter chips. Rendered wherever the composer runs a new conversation (main app and the
 * minimal `/agent` surface), so it stays in sync from a single place.
 */
interface ConversationStartersProps {
    starters: string[];
    onSelect: (text: string) => void;
    className?: string;
}

export const ConversationStarters = ({ starters, onSelect, className }: ConversationStartersProps) => {
    if (!starters.length) {
        return null;
    }

    return (
        <div className={clsx('flex flex-wrap gap-2', className)}>
            {starters.map((starter, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelect(starter)}
                    className="text-left text-sm color-norm bg-norm border border-weak rounded-full px-3 py-1 interactive-pseudo-inset"
                >
                    {starter}
                </button>
            ))}
        </div>
    );
};
