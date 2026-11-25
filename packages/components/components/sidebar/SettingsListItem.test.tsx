import { MemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';

import { ThemeColor } from '@proton/colors/types';
import { IcBrandProton } from '@proton/icons/icons/IcBrandProton';

import SettingsListItem from './SettingsListItem';

const testId = 'test-id';
const content = 'Content';
const children = <span data-testid={testId}>{content}</span>;

describe('SettingsListItem', () => {
    it('shows children', async () => {
        render(<SettingsListItem>{children}</SettingsListItem>);

        expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    it('shows icon', () => {
        const { container } = render(<SettingsListItem icon={IcBrandProton}>{children}</SettingsListItem>);
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
        render(<SettingsListItem notification={ThemeColor.Weak}>{children}</SettingsListItem>);
        const element = screen.getByText('Attention required');

        expect(element).toBeInTheDocument();
    });

    it('announces the notification with its label', () => {
        render(
            <SettingsListItem notification={ThemeColor.Danger} notificationLabel="Update recovery file">
                {children}
            </SettingsListItem>
        );

        expect(screen.getByText('Update recovery file')).toHaveClass('sr-only');
    });

    it('announces the notification with a generic label by default', () => {
        render(<SettingsListItem notification={ThemeColor.Danger}>{children}</SettingsListItem>);

        expect(screen.getByText('Attention required')).toHaveClass('sr-only');
    });

    it('shows both `to` and `icon`', () => {
        const href = '/test-href';
        const { container } = render(
            <MemoryRouter>
                <SettingsListItem to={href} icon={IcBrandProton}>
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
