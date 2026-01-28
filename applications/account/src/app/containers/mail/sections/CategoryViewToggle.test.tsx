import { render, screen } from '@testing-library/react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import useFlag from '@proton/unleash/useFlag';

import { CategoryViewToggle } from './CategoryViewToggle';

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

jest.mock('@proton/account/organization/hooks');
const mockUseOrganization = useOrganization as jest.Mock;

// We assume the flag is always enabled
jest.mock('@proton/unleash/useFlag');
jest.mocked(useFlag).mockReturnValue(true);

jest.mock('@proton/components/hooks/useNotifications', () =>
    jest.fn().mockReturnValue({ createNotification: jest.fn() })
);

jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    __esModule: true,
    useDispatch: () => jest.fn(),
}));

describe('CategoryViewSection', () => {
    describe('setting is visible', () => {
        it('should have visible switch and checked if the setting is on', () => {
            mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, MailCategoryView: true }]);
            mockUseOrganization.mockReturnValue([{ Settings: { MailCategoryViewEnabled: true } }]);

            render(<CategoryViewToggle onToggleCallback={() => {}} />);

            const label = screen.getByTestId('toggle-switch');
            expect(label).toBeInTheDocument();

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toBeChecked();
        });

        it('should have visible switch and unchecked if the setting is off', () => {
            mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, MailCategoryView: false }]);
            mockUseOrganization.mockReturnValue([{ Settings: { MailCategoryViewEnabled: true } }]);

            render(<CategoryViewToggle onToggleCallback={() => {}} />);

            const label = screen.getByTestId('toggle-switch');
            expect(label).toBeInTheDocument();

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).not.toBeChecked();
        });
    });
});
