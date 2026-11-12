import { fireEvent, render, screen } from '@testing-library/react';

import type { MoreMenuToggle } from './MoreMenuItems';
import { MoreMenuSections } from './MoreMenuItems';

const Icon = () => <span />;
const onChange = vi.fn();

const menu = (toggle: Partial<MoreMenuToggle> = {}) => (
    <MoreMenuSections
        toggles={[{ id: 'captions', Icon, label: 'Live captions', checked: false, onChange, ...toggle }]}
        actions={[]}
        onClose={vi.fn()}
    />
);

const renderToggle = (toggle: Partial<MoreMenuToggle> = {}) => render(menu(toggle));

describe('MoreMenuToggleItem', () => {
    it('describes a disabled toggle with the reason', () => {
        renderToggle({ disabled: true, tooltip: 'Host has disabled live captions.' });

        const checkbox = screen.getByRole('checkbox', { name: 'Live captions' });

        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveAccessibleDescription('Host has disabled live captions.');
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
        rerender(menu({ checked: true, loading: true }));
        expect(document.activeElement).toBe(document.body);

        rerender(menu({ checked: true }));

        expect(checkbox).toHaveFocus();
    });
});
