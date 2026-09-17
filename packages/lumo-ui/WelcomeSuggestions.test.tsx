import { fireEvent, render, screen } from '@testing-library/react';

import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcLightbulb } from '@proton/icons/icons/IcLightbulb';

import WelcomeSuggestions from './WelcomeSuggestions';

const cards = [
    {
        id: 'triage',
        icon: IcInbox,
        getTitle: () => 'What needs handling?',
        getDescription: () => "I'll read your last 7 days and tell you what needs a reply.",
        getPrompt: () => 'Tell me what I need to handle',
    },
    {
        id: 'capabilities',
        icon: IcLightbulb,
        getTitle: () => 'What can you do?',
        getDescription: () => 'A tour of what I can do in here.',
        getPrompt: () => 'What can you help me with?',
    },
];

describe('WelcomeSuggestions', () => {
    // The list and the click handler are indexed independently, so a card sending its neighbour's prompt
    // is the failure this guards.
    it('picks the prompt belonging to the card that was clicked', () => {
        const onPick = jest.fn();
        render(<WelcomeSuggestions cards={cards} onPick={onPick} />);

        fireEvent.click(screen.getByRole('button', { name: /What can you do\?/ }));

        expect(onPick).toHaveBeenCalledWith('What can you help me with?');
    });
});
