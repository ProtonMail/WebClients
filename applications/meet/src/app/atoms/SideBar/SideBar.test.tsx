import { useState } from 'react';
import { createPortal } from 'react-dom';

import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MEETING_CONTROLS_TOOLBAR_ID } from '../../constants';
import { SideBar } from './SideBar';
import { SideBarTitle } from './SideBarTitle';

const Panel = ({ onClose, withAutoFocusInput = false }: { onClose: () => void; withAutoFocusInput?: boolean }) => (
    <SideBar onClose={onClose} aria-label="Participants" header={<SideBarTitle>Participants</SideBarTitle>}>
        {withAutoFocusInput && <input aria-label="Composer" autoFocus />}
    </SideBar>
);

const PanelWithOpener = ({ showOpener = true }: { showOpener?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <div id={MEETING_CONTROLS_TOOLBAR_ID} role="toolbar" aria-label="Meeting controls">
                <button type="button" tabIndex={-1}>
                    Microphone
                </button>
                <button type="button" tabIndex={0}>
                    More options
                </button>
            </div>
            {showOpener && (
                <button type="button" onClick={() => setIsOpen(true)}>
                    Open participants
                </button>
            )}
            <button type="button" onClick={() => setIsOpen(false)}>
                Close from outside
            </button>
            {isOpen && <Panel onClose={() => setIsOpen(false)} />}
        </>
    );
};

describe('SideBar', () => {
    afterEach(() => {
        cleanup();
    });

    it('moves focus to the panel title on open', () => {
        render(<Panel onClose={vi.fn()} />);

        expect(screen.getByRole('heading', { name: 'Participants' })).toHaveFocus();
    });

    it('keeps focus on an element of the panel that is already focused on open', () => {
        render(<Panel onClose={vi.fn()} withAutoFocusInput />);

        expect(screen.getByRole('textbox', { name: 'Composer' })).toHaveFocus();
    });

    it('closes on Escape pressed inside the panel', () => {
        const onClose = vi.fn();
        render(<Panel onClose={onClose} />);

        fireEvent.keyDown(screen.getByRole('heading', { name: 'Participants' }), { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([{ isComposing: true }, { keyCode: 229 }])(
        'stays open and leaves the event alone on Escape that cancels an IME composition (%o)',
        (composition) => {
            const onClose = vi.fn();
            render(<Panel onClose={onClose} withAutoFocusInput />);
            const composer = screen.getByRole('textbox', { name: 'Composer' });
            const escapeEvent = createEvent.keyDown(composer, { key: 'Escape', ...composition });

            fireEvent(composer, escapeEvent);

            expect(onClose).not.toHaveBeenCalled();
            expect(escapeEvent.defaultPrevented).toBe(false);
        }
    );

    it('stays open when an inner widget already handled Escape', () => {
        const onClose = vi.fn();
        render(
            <SideBar onClose={onClose} aria-label="Chat">
                <input aria-label="Search" onKeyDown={(event) => event.preventDefault()} />
            </SideBar>
        );

        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('stays open on Escape pressed in content the panel renders into a portal', () => {
        const onClose = vi.fn();
        render(
            <SideBar onClose={onClose} aria-label="Chat">
                {createPortal(<button type="button">In portal</button>, document.body)}
            </SideBar>
        );

        fireEvent.keyDown(screen.getByRole('button', { name: 'In portal' }), { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('restores focus to the opener on close', () => {
        render(<PanelWithOpener />);
        const opener = screen.getByRole('button', { name: 'Open participants' });
        opener.focus();
        fireEvent.click(opener);
        expect(screen.getByRole('heading', { name: 'Participants' })).toHaveFocus();

        fireEvent.keyDown(screen.getByRole('heading', { name: 'Participants' }), { key: 'Escape' });

        expect(screen.queryByRole('complementary', { name: 'Participants' })).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });

    it('moves focus to the meeting controls tab stop when the opener is gone on close', () => {
        const { rerender } = render(<PanelWithOpener />);
        const opener = screen.getByRole('button', { name: 'Open participants' });
        opener.focus();
        fireEvent.click(opener);
        rerender(<PanelWithOpener showOpener={false} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close from outside' }));

        expect(screen.queryByRole('complementary', { name: 'Participants' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'More options' })).toHaveFocus();
    });
});
