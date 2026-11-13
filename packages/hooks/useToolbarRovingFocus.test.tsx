import { fireEvent, render, screen } from '@testing-library/react';

import { useToolbarRovingFocus } from './useToolbarRovingFocus';

const Toolbar = ({ orientation }: { orientation?: 'horizontal' | 'vertical' | 'both' }) => {
    const { toolbarProps } = useToolbarRovingFocus({ orientation });
    return (
        <div role="toolbar" {...toolbarProps}>
            <button type="button">First</button>
            <button type="button" disabled>
                Disabled
            </button>
            <button type="button">Second</button>
            <button type="button" data-hidden>
                Hidden
            </button>
            <button type="button">Third</button>
        </div>
    );
};

const ToolbarWithDialog = () => {
    const { toolbarProps } = useToolbarRovingFocus();
    return (
        <div role="toolbar" {...toolbarProps}>
            <button type="button">First</button>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div role="dialog" aria-label="Sheet">
                <button type="button">Sheet first</button>
                <button type="button">Sheet second</button>
            </div>
            <button type="button">Second</button>
        </div>
    );
};

const button = (name: string) => screen.getByRole('button', { name });

describe('useToolbarRovingFocus', () => {
    beforeAll(() => {
        // jsdom does no layout, so offsetParent is always null: treat every element without data-hidden as visible.
        Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
            configurable: true,
            get(this: HTMLElement) {
                return this.hasAttribute('data-hidden') ? null : this.parentElement;
            },
        });
    });

    afterAll(() => {
        delete (HTMLElement.prototype as { offsetParent?: unknown }).offsetParent;
    });

    it('keeps only the first visible enabled button in the tab order', () => {
        render(<Toolbar />);

        expect(button('First').tabIndex).toBe(0);
        expect(button('Second').tabIndex).toBe(-1);
        expect(button('Third').tabIndex).toBe(-1);
    });

    it('moves focus with the arrow keys, skipping disabled and hidden buttons and wrapping around', () => {
        render(<Toolbar />);
        button('First').focus();

        fireEvent.keyDown(button('First'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('Second'));

        fireEvent.keyDown(button('Second'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('Third'));

        fireEvent.keyDown(button('Third'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('First'));

        fireEvent.keyDown(button('First'), { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(button('Third'));
        expect(button('Third').tabIndex).toBe(0);
        expect(button('First').tabIndex).toBe(-1);
    });

    it('moves focus to the ends with Home and End', () => {
        render(<Toolbar />);
        button('Second').focus();

        fireEvent.keyDown(button('Second'), { key: 'End' });
        expect(document.activeElement).toBe(button('Third'));

        fireEvent.keyDown(button('Third'), { key: 'Home' });
        expect(document.activeElement).toBe(button('First'));
    });

    it('makes the focused button the tab stop', () => {
        render(<Toolbar />);

        fireEvent.focus(button('Third'));

        expect(button('Third').tabIndex).toBe(0);
        expect(button('First').tabIndex).toBe(-1);
    });

    it('leaves the buttons of a dialog inside the toolbar out of its roving focus', () => {
        render(<ToolbarWithDialog />);

        expect(button('Sheet first').tabIndex).toBe(0);
        expect(button('Sheet second').tabIndex).toBe(0);

        button('First').focus();
        fireEvent.keyDown(button('First'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('Second'));
        fireEvent.keyDown(button('Second'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('First'));

        button('Sheet second').focus();
        fireEvent.keyDown(button('Sheet second'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('Sheet second'));
        expect(button('First').tabIndex).toBe(0);
        expect(button('Sheet second').tabIndex).toBe(0);
    });

    it('uses the up and down arrows only for a vertical toolbar', () => {
        const { unmount } = render(<Toolbar />);
        button('First').focus();
        fireEvent.keyDown(button('First'), { key: 'ArrowDown' });
        expect(document.activeElement).toBe(button('First'));
        unmount();

        render(<Toolbar orientation="vertical" />);
        button('First').focus();
        fireEvent.keyDown(button('First'), { key: 'ArrowRight' });
        expect(document.activeElement).toBe(button('First'));
        fireEvent.keyDown(button('First'), { key: 'ArrowDown' });
        expect(document.activeElement).toBe(button('Second'));
    });
});
