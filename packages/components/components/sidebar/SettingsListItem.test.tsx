import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ThemeColor } from '@proton/colors/types';
import SettingsListItem from '@proton/components/components/sidebar/SettingsListItem';

const testId = 'test-id';
const content = 'Content';
const children = <span data-testid={testId}>{content}</span>;

describe('SettingsListItem', () => {
    it('shows children', async () => {
        render(<SettingsListItem>{children}</SettingsListItem>);

        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    it('shows icon', () => {
        const { container } = render(<SettingsListItem icon="brand-proton">{children}</SettingsListItem>);
        const svg = container.querySelector('svg');

        expect(svg).toBeInTheDocument();
    });

    it('shows <a>', () => {
        const href = '/test-href';
        render(
            <MemoryRouter>
                <SettingsListItem to={href}>{children}</SettingsListItem>
            </MemoryRouter>
        );
        const link = screen.getByRole('link', { name: content });

        expect(link).toHaveAttribute('href', href);
    });

    it('shows notification', () => {
        const { container } = render(<SettingsListItem notification={ThemeColor.Weak}>{children}</SettingsListItem>);
        const element = container.querySelector('.notification-dot');

        expect(element).toBeInTheDocument();
    });

    it('shows both `to` and `icon`', () => {
        const href = '/test-href';
        const { container } = render(
            <MemoryRouter>
                <SettingsListItem to={href} icon="brand-proton">
                    {children}
                </SettingsListItem>
            </MemoryRouter>
        );
        const link = screen.getByRole('link', { name: content });
        expect(link).toHaveAttribute('href', href);

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
