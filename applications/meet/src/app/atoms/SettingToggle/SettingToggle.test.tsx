import { fireEvent, render, screen } from '@testing-library/react';

import { SettingToggle } from './SettingToggle';

type ToggleProps = Parameters<typeof SettingToggle>[0];

const defaultProps: ToggleProps = {
    id: 'captions',
    label: 'Live captions',
    ariaLabel: 'Live captions',
    checked: false,
    onChange: vi.fn(),
};

const renderToggle = (props: Partial<ToggleProps> = {}) => render(<SettingToggle {...defaultProps} {...props} />);

describe('SettingToggle', () => {
    it('describes a disabled toggle with the reason', () => {
        renderToggle({ disabled: true, tooltip: 'Host has disabled live captions.' });

        const checkbox = screen.getByRole('checkbox', { name: 'Live captions' });

        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveAccessibleDescription('Host has disabled live captions.');
    });

    it('joins the reason with the description', () => {
        renderToggle({ description: 'Show captions', tooltip: 'Not available.' });

        expect(screen.getByRole('checkbox', { name: 'Live captions' })).toHaveAccessibleDescription(
            'Show captions Not available.'
        );
    });

    it('has no description without a tooltip', () => {
        renderToggle({ disabled: true });

        expect(screen.getByRole('checkbox', { name: 'Live captions' })).toHaveAccessibleDescription('');
    });

    it('puts focus back on the toggle once it finishes saving', () => {
        const { rerender } = renderToggle();
        const checkbox = screen.getByRole('checkbox', { name: 'Live captions' });

        checkbox.focus();
        fireEvent.click(checkbox);
        checkbox.blur();
        rerender(<SettingToggle {...defaultProps} checked loading />);
        expect(document.activeElement).toBe(document.body);

        rerender(<SettingToggle {...defaultProps} checked />);

        expect(checkbox).toHaveFocus();
    });

    it('takes focus back from the container a focus trap moved it to', () => {
        const panel = (props: Partial<ToggleProps>) => (
            <aside tabIndex={-1} aria-label="Settings">
                <SettingToggle {...defaultProps} {...props} />
            </aside>
        );
        const { rerender } = render(panel({}));
        const checkbox = screen.getByRole('checkbox', { name: 'Live captions' });

        checkbox.focus();
        fireEvent.click(checkbox);
        screen.getByRole('complementary', { name: 'Settings' }).focus();
        rerender(panel({ checked: true, loading: true }));

        rerender(panel({ checked: true }));

        expect(checkbox).toHaveFocus();
    });

    it('leaves focus where the user moved it while saving', () => {
        const { rerender } = render(
            <>
                <SettingToggle {...defaultProps} />
                <button type="button">Elsewhere</button>
            </>
        );
        const checkbox = screen.getByRole('checkbox', { name: 'Live captions' });
        const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });

        checkbox.focus();
        fireEvent.click(checkbox);
        rerender(
            <>
                <SettingToggle {...defaultProps} checked loading />
                <button type="button">Elsewhere</button>
            </>
        );
        elsewhere.focus();

        rerender(
            <>
                <SettingToggle {...defaultProps} checked />
                <button type="button">Elsewhere</button>
            </>
        );

        expect(elsewhere).toHaveFocus();
    });
});
