import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { IcBug } from '@proton/icons/icons/IcBug';

import { DebugMenu } from './DebugMenu';

const flushTimers = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });

const renderMenu = () => {
    const openDebugOverlay = vi.fn();
    const openMeetingDebug = vi.fn();
    render(
        <DebugMenu
            actions={[
                { id: 'debug-overlay', Icon: IcBug, label: 'Debug overlay', onClick: openDebugOverlay },
                { id: 'meeting-debug', Icon: IcBug, label: 'Meeting debug', onClick: openMeetingDebug },
            ]}
        />
    );
    return { openDebugOverlay, openMeetingDebug };
};

const debugButton = () => screen.getByRole('button', { name: 'Debug' });

const openMenu = async () => {
    fireEvent.click(debugButton());
    await flushTimers();
    return screen.getByRole('dialog', { name: 'Debug' });
};

describe('DebugMenu', () => {
    it('shows no button when there are no debug tools', () => {
        render(<DebugMenu actions={[]} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows a closed Debug button', () => {
        renderMenu();

        expect(debugButton()).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('dialog', { name: 'Debug' })).not.toBeInTheDocument();
    });

    it('opens a Debug menu listing Debug overlay then Meeting debug', async () => {
        renderMenu();

        const menu = await openMenu();

        expect(debugButton()).toHaveAttribute('aria-expanded', 'true');
        const rowNames = within(menu)
            .getAllByRole('button', { name: /debug/i })
            .map((button) => button.textContent);
        expect(rowNames).toEqual(['Debug overlay', 'Meeting debug']);
    });

    it.each([
        ['Debug overlay', 'openDebugOverlay'],
        ['Meeting debug', 'openMeetingDebug'],
    ] as const)('runs %s once and closes the menu', async (rowName, handlerName) => {
        const handlers = renderMenu();

        const menu = await openMenu();
        fireEvent.click(within(menu).getByRole('button', { name: rowName }));
        fireEvent.animationEnd(menu, { animationName: 'anime-dropdown-out' });

        expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
        expect(debugButton()).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('dialog', { name: 'Debug' })).not.toBeInTheDocument();
    });
});
