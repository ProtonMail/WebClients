import type { ComponentProps } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import LumoFloatingPanelMenu from './LumoFloatingPanelMenu';
import { PanelSide } from './panelSide';

jest.mock('@proton/icons/icons/IcArrowLeft', () => ({
    IcArrowLeft: ({ alt }: { alt: string }) => <span data-testid="arrow-left">{alt}</span>,
}));
jest.mock('@proton/icons/icons/IcArrowRight', () => ({
    IcArrowRight: ({ alt }: { alt: string }) => <span data-testid="arrow-right">{alt}</span>,
}));

type MenuProps = ComponentProps<typeof LumoFloatingPanelMenu>;

const menuProps = (): MenuProps => {
    return {
        side: PanelSide.RIGHT,
        hasConversation: true,
        onReportProblem: jest.fn(),
        onNewChat: jest.fn(),
        onSwitchSides: jest.fn(),
        onDock: jest.fn(),
    };
};

const renderMenu = ({ side, hasConversation, onReportProblem, onNewChat, onSwitchSides, onDock }: MenuProps) => {
    return render(
        <LumoFloatingPanelMenu
            side={side}
            hasConversation={hasConversation}
            onReportProblem={onReportProblem}
            onNewChat={onNewChat}
            onSwitchSides={onSwitchSides}
            onDock={onDock}
        />
    );
};

const hamburger = () => {
    return screen.getByRole('button', { name: 'Lumo actions' });
};

const chipLabels = () => {
    return screen
        .getAllByRole('button')
        .filter((button) => button !== hamburger())
        .map((button) => button.textContent);
};

const openBar = () => {
    fireEvent.click(hamburger());
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
};

describe('LumoFloatingPanelMenu opening and closing', () => {
    it('toggles the bar on each hamburger click', () => {
        renderMenu(menuProps());
        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');

        openBar();
        fireEvent.click(hamburger());

        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the bar when a chip is picked', () => {
        const props = menuProps();
        renderMenu(props);
        openBar();

        fireEvent.click(screen.getByRole('button', { name: 'Switch sides' }));

        expect(props.onSwitchSides).toHaveBeenCalledTimes(1);
        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the bar on a press outside it', () => {
        renderMenu(menuProps());
        openBar();

        fireEvent.pointerDown(document.body);

        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('stays open on a press inside it', () => {
        renderMenu(menuProps());
        openBar();

        fireEvent.pointerDown(screen.getByRole('button', { name: 'Dock to side panel' }));

        expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes only the bar on Escape, keeping the key from the panel behind it', () => {
        const panelKeyDown = jest.fn();
        document.addEventListener('keydown', panelKeyDown);
        renderMenu(menuProps());
        openBar();

        fireEvent.keyDown(hamburger(), { key: 'Escape' });

        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
        expect(panelKeyDown).not.toHaveBeenCalled();
        document.removeEventListener('keydown', panelKeyDown);
    });

    it.each([
        ['opens the bar on keyboard focus', true, 'true'],
        ['leaves the bar to the click on a mouse press focus', false, 'false'],
    ])('%s', (_, isFocusVisible, expanded) => {
        renderMenu(menuProps());
        const button = hamburger();
        jest.spyOn(button, 'matches').mockReturnValue(isFocusVisible);

        fireEvent.focusIn(button);

        expect(button).toHaveAttribute('aria-expanded', expanded);
        expect(button.matches).toHaveBeenCalledWith(':focus-visible');
    });

    it('closes the bar when focus moves out of it', () => {
        render(
            <>
                <LumoFloatingPanelMenu {...menuProps()} />
                <button type="button">Elsewhere</button>
            </>
        );
        openBar();

        fireEvent.focusOut(hamburger(), { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });

        expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('LumoFloatingPanelMenu', () => {
    it('offers only switch and dock before a conversation exists', () => {
        renderMenu({ ...menuProps(), hasConversation: false });

        expect(chipLabels()).toEqual(['Switch sides', 'Dock to side panel']);
    });

    it('stacks report, new chat, switch and dock top to bottom during a conversation', () => {
        renderMenu(menuProps());

        expect(chipLabels()).toEqual(['Report a problem', 'New chat', 'Switch sides', 'Dock to side panel']);
    });

    it('wires each chip to its own handler', () => {
        const props = menuProps();
        renderMenu(props);

        fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));
        fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
        fireEvent.click(screen.getByRole('button', { name: 'Switch sides' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dock to side panel' }));

        expect(props.onReportProblem).toHaveBeenCalledTimes(1);
        expect(props.onNewChat).toHaveBeenCalledTimes(1);
        expect(props.onSwitchSides).toHaveBeenCalledTimes(1);
        expect(props.onDock).toHaveBeenCalledTimes(1);
    });

    it('points the switch arrow where the panel will go', () => {
        const { unmount } = renderMenu({ ...menuProps(), side: PanelSide.RIGHT });
        expect(screen.getByTestId('arrow-left')).toBeInTheDocument();
        unmount();

        renderMenu({ ...menuProps(), side: PanelSide.LEFT });
        expect(screen.getByTestId('arrow-right')).toBeInTheDocument();
    });
});
