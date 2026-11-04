import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SideBarSearch } from './SideBarSearch';

describe('SideBarSearch', () => {
    afterEach(() => {
        cleanup();
    });

    it.each([
        { control: 'search input', getControl: () => screen.getByRole('searchbox', { name: 'Find...' }) },
        { control: 'Cancel button', getControl: () => screen.getByRole('button', { name: 'Close search' }) },
    ])(
        'closes and clears the search on Escape in the $control without letting it close the panel',
        ({ getControl }) => {
            const setIsSearchOn = vi.fn();
            const setSearchExpression = vi.fn();
            render(
                <SideBarSearch
                    searchExpression="Ali"
                    setSearchExpression={setSearchExpression}
                    setIsSearchOn={setIsSearchOn}
                    placeholder="Find..."
                />
            );
            const control = getControl();
            const escapeEvent = createEvent.keyDown(control, { key: 'Escape' });

            fireEvent(control, escapeEvent);

            expect(setIsSearchOn).toHaveBeenCalledWith(false);
            expect(setSearchExpression).toHaveBeenCalledWith('');
            expect(escapeEvent.defaultPrevented).toBe(true);
        }
    );

    it.each([{ isComposing: true }, { keyCode: 229 }])(
        'keeps the search open and leaves the event alone on Escape that cancels an IME composition (%o)',
        (composition) => {
            const setIsSearchOn = vi.fn();
            const setSearchExpression = vi.fn();
            render(
                <SideBarSearch
                    searchExpression="Ali"
                    setSearchExpression={setSearchExpression}
                    setIsSearchOn={setIsSearchOn}
                    placeholder="Find..."
                />
            );
            const searchInput = screen.getByRole('searchbox', { name: 'Find...' });
            const escapeEvent = createEvent.keyDown(searchInput, { key: 'Escape', ...composition });

            fireEvent(searchInput, escapeEvent);

            expect(setIsSearchOn).not.toHaveBeenCalled();
            expect(setSearchExpression).not.toHaveBeenCalled();
            expect(escapeEvent.defaultPrevented).toBe(false);
        }
    );
});
