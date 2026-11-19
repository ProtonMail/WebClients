import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useOrganization } from '@proton/account/organization/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash/useFlag';

import { CategoryViewToggle } from './CategoryViewToggle';

vi.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as Mock;

vi.mock('@proton/account/organization/hooks');
const mockUseOrganization = useOrganization as Mock;

// We assume the flag is always enabled
vi.mock('@proton/unleash/useFlag');
vi.mocked(useFlag).mockReturnValue(false);

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({ createNotification: vi.fn() }),
}));

vi.mock('@proton/react-redux-store/ProtonStoreContext', async () => ({
    ...(await vi.importActual('@proton/react-redux-store/ProtonStoreContext')),
    baseUseDispatch: () => vi.fn(),
}));

vi.mock('@proton/mail/features/categoriesView/useCategoriesTelemetry', () => ({
    useCategoriesTelemetry: () => ({
        sendReportChangeCategorySettings: vi.fn(),
    }),
}));

vi.mock('@proton/mail/features/categoriesView/useMarkOnboardingComplete', () => ({
    useMarkOnboardingComplete: () => vi.fn(),
}));

describe('CategoryViewSection', () => {
    describe('setting is visible', () => {
        it('should have visible switch and checked if the setting is on', () => {
            mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, MailCategoryView: true }]);
            mockUseOrganization.mockReturnValue([{ Settings: { MailCategoryViewEnabled: true } }]);

            render(<CategoryViewToggle />);

            const label = screen.getByTestId('toggle-switch');
            expect(label).toBeInTheDocument();

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toBeChecked();
        });

        it('should have visible switch and unchecked if the setting is off', () => {
            mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, MailCategoryView: false }]);
            mockUseOrganization.mockReturnValue([{ Settings: { MailCategoryViewEnabled: true } }]);

            render(<CategoryViewToggle />);

            const label = screen.getByTestId('toggle-switch');
            expect(label).toBeInTheDocument();

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).not.toBeChecked();
        });
    });
});
