import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { TestStoreProvider } from '@proton/account/testing/TestStoreProvider';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { mockUseApi } from '@proton/app-context/testing/vitest/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import OrganizationAccountRecoverySection from './OrganizationAccountRecoverySection';

vi.mock('@proton/account/userPermissions/hooks');
const mockedUseUserPermissions = useUserPermissions as Mock;

vi.mock('./membersWithoutRecovery', () => ({
    useMembersWithoutRecovery: () => [undefined, false],
}));

const renderSection = (AdminOptionalForPasswordChange: boolean) => {
    const { store } = getTestStore({
        reducer: () => ({}),
        extraThunkArguments: {} as ProtonThunkArguments,
    });
    const organization = { Settings: { AdminOptionalForPasswordChange } } as OrganizationExtended;

    return render(
        <TestStoreProvider store={store}>
            <OrganizationAccountRecoverySection organization={organization} />
        </TestStoreProvider>
    );
};

describe('OrganizationAccountRecoverySection', () => {
    let mockedApi: Mock;

    beforeEach(() => {
        mockedApi = vi.fn().mockResolvedValue({});
        mockUseApi(mockedApi);
        mockUseNotifications();
        mockedUseUserPermissions.mockReturnValue([{ permissions: { 'account.security_policy.update': true } }]);
    });

    it('shows admin approval as required when it is not optional', () => {
        renderSection(false);

        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    it('shows admin approval as not required when it is optional', () => {
        renderSection(true);

        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('makes admin approval optional when the admin turns the requirement off', async () => {
        renderSection(false);

        fireEvent.click(screen.getByRole('checkbox'));

        await waitFor(() => {
            expect(mockedApi).toHaveBeenCalledWith(
                updateOrganizationSettings({ AdminOptionalForPasswordChange: true })
            );
        });
    });

    it('makes admin approval required when the admin turns the requirement on', async () => {
        renderSection(true);

        fireEvent.click(screen.getByRole('checkbox'));

        await waitFor(() => {
            expect(mockedApi).toHaveBeenCalledWith(
                updateOrganizationSettings({ AdminOptionalForPasswordChange: false })
            );
        });
    });
});
