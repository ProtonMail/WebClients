import { fireEvent, render, screen } from '@testing-library/react';

import BackToMenuButton from './BackToMenuButton';

const clickBackToMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Back to menu' }));

describe('BackToMenuButton', () => {
    it('focuses the sidebar item of the current page', () => {
        render(
            <>
                <nav className="sidebar">
                    <a href="/first">First</a>
                    <a href="/second" aria-current="page">
                        Second
                    </a>
                </nav>
                <BackToMenuButton />
            </>
        );

        clickBackToMenu();

        expect(screen.getByRole('link', { name: 'Second' })).toHaveFocus();
    });

    it('focuses the most specific current item when several are marked', () => {
        render(
            <>
                <nav className="sidebar">
                    <a href="/parent" aria-current="page">
                        Parent
                    </a>
                    <a href="/parent/child" aria-current="page">
                        Child
                    </a>
                </nav>
                <BackToMenuButton />
            </>
        );

        clickBackToMenu();

        expect(screen.getByRole('link', { name: 'Child' })).toHaveFocus();
    });

    it('focuses the first sidebar item when no item is current', () => {
        render(
            <>
                <nav className="sidebar">
                    <a href="/first">First</a>
                    <a href="/second">Second</a>
                </nav>
                <BackToMenuButton />
            </>
        );

        clickBackToMenu();

        expect(screen.getByRole('link', { name: 'First' })).toHaveFocus();
    });

    it('focuses the open navigation button when the sidebar is collapsed', () => {
        render(
            <>
                <button type="button" className="hamburger" aria-expanded={false}>
                    Open navigation
                </button>
                <nav className="sidebar" style={{ visibility: 'hidden' }}>
                    <a href="/first" aria-current="page">
                        First
                    </a>
                </nav>
                <BackToMenuButton />
            </>
        );

        clickBackToMenu();

        expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
    });
});
