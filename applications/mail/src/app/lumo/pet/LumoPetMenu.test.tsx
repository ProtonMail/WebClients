import { fireEvent, render, screen } from '@testing-library/react';

import { getConversationActions } from '@proton/llm/lib/lumoAgent/ui/LumoConversationHeaderActions';

import { PanelSide } from '../floating/panelSide';
import LumoPetMenu from './LumoPetMenu';

jest.mock('@proton/icons/icons/IcArrowLeft', () => ({
    IcArrowLeft: ({ alt }: { alt: string }) => <span data-testid="arrow-left">{alt}</span>,
}));
jest.mock('@proton/icons/icons/IcArrowRight', () => ({
    IcArrowRight: ({ alt }: { alt: string }) => <span data-testid="arrow-right">{alt}</span>,
}));

const onMove = jest.fn();
const onDock = jest.fn();
const onHide = jest.fn();
const clear = jest.fn();
const openDebugReport = jest.fn();

const renderMenu = (side: PanelSide, hasConversation: boolean) => {
    return render(
        <LumoPetMenu
            side={side}
            onMove={onMove}
            onDock={onDock}
            onHide={onHide}
            conversationActions={getConversationActions({ hasConversation, clear, openDebugReport })}
        />
    );
};

const buttonLabels = () => screen.getAllByRole('button').map((button) => button.textContent);

beforeEach(() => jest.clearAllMocks());

describe('LumoPetMenu', () => {
    it.each([
        [PanelSide.RIGHT, false, ['Move Lumo to the left', 'Hide Lumo', 'Dock to side panel']],
        [PanelSide.LEFT, false, ['Move Lumo to the right', 'Hide Lumo', 'Dock to side panel']],
        [
            PanelSide.RIGHT,
            true,
            ['Move Lumo to the left', 'Hide Lumo', 'Dock to side panel', 'New chat', 'Report a problem'],
        ],
        [
            PanelSide.LEFT,
            true,
            ['Move Lumo to the right', 'Hide Lumo', 'Dock to side panel', 'New chat', 'Report a problem'],
        ],
    ])(
        'stacks the buttons from the head upwards in the same order with the cat on the %s, conversation %s',
        (side, hasConversation, labels) => {
            renderMenu(side, hasConversation);

            expect(buttonLabels()).toEqual(labels);
        }
    );

    it('keeps New chat above the core buttons when a problem cannot be reported', () => {
        render(
            <LumoPetMenu
                side={PanelSide.RIGHT}
                onMove={onMove}
                onDock={onDock}
                onHide={onHide}
                conversationActions={getConversationActions({ hasConversation: true, clear })}
            />
        );

        expect(buttonLabels()).toEqual(['Move Lumo to the left', 'Hide Lumo', 'Dock to side panel', 'New chat']);
    });

    it.each([
        [PanelSide.RIGHT, 'arrow-left'],
        [PanelSide.LEFT, 'arrow-right'],
    ])('points the move arrow away from the %s side', (side, arrowTestId) => {
        renderMenu(side, false);

        expect(screen.getByTestId(arrowTestId)).toBeInTheDocument();
    });

    it('wires each button to its own handler', () => {
        renderMenu(PanelSide.RIGHT, true);

        fireEvent.click(screen.getByRole('button', { name: 'Move Lumo to the left' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dock to side panel' }));
        fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
        fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));
        fireEvent.click(screen.getByRole('button', { name: 'Hide Lumo' }));

        expect(onMove).toHaveBeenCalledTimes(1);
        expect(onDock).toHaveBeenCalledTimes(1);
        expect(onHide).toHaveBeenCalledTimes(1);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(openDebugReport).toHaveBeenCalledTimes(1);
    });
});
