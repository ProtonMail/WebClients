import { Button } from '@proton/atoms/Button/Button';

import type { IconComponent } from './types';

/** One card in the empty state: fixed copy over a fixed prompt, sent verbatim when the card is picked. */
export interface WelcomeSuggestionCard {
    id: string;
    icon: IconComponent;
    /** Called at render, not at config time, so the wording follows an in-session language change. */
    getTitle: () => string;
    getDescription: () => string;
    getPrompt: () => string;
}

interface Props {
    cards: WelcomeSuggestionCard[];
    onPick: (prompt: string) => void;
}

/**
 * The transcript's empty state. There is no heading or intro line: the cards are the whole state, and
 * each one says in a sentence what picking it will do. Picking hands the prompt straight to `onPick`;
 * the host sends it as the user's own turn, so nothing is prefilled.
 */
const WelcomeSuggestions = ({ cards, onPick }: Props) => (
    <div className="lumo-welcome flex flex-column flex-nowrap gap-2">
        {cards.map(({ id, icon: Icon, getTitle, getDescription, getPrompt }) => (
            <Button
                key={id}
                shape="ghost"
                color="weak"
                fullWidth
                className="lumo-welcome-card"
                onClick={() => onPick(getPrompt())}
            >
                <span className="lumo-welcome-card__glyph shrink-0">
                    <Icon />
                </span>
                <span className="lumo-welcome-card__text flex flex-column flex-nowrap">
                    <span className="text-semibold">{getTitle()}</span>
                    <span className="lumo-welcome-card__description color-weak text-sm">{getDescription()}</span>
                </span>
            </Button>
        ))}
    </div>
);

export default WelcomeSuggestions;
