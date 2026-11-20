import { render } from '@testing-library/react';
import type { Mock } from 'vitest';

import { mockUseOrganization } from '@proton/account/testing/vitest/mockUseOrganization';
import { useUser } from '@proton/account/user/hooks';
import { applyHOCs } from '@proton/components/testing/hocs/helpers';
import { withReduxStore } from '@proton/components/testing/vitest/with-redux-store';
import { withConfig } from '@proton/components/testing/with-config';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { INVOICE_EMAIL_STATE } from '@proton/shared/lib/constants';
import type { InvoiceEmailSettings, OrganizationSettings } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import InvoiceOptionsSection from './InvoiceOptionsSection';

vi.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useUser: vi.fn(() => [{ isPaid: false, Flags: {} }, false]),
    useGetUser: vi.fn(() => [{ isPaid: false, Flags: {} }, false]),
}));

vi.mock('@proton/account/subscription/hooks', () => ({
    __esModule: true,
    useSubscription: vi.fn().mockReturnValue([]),
}));

const useFlagMock = vi.fn();

vi.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: (flag: string) => useFlagMock(flag),
}));

const mockFlags = (overrides: Record<string, boolean> = {}) => {
    const flags: Record<string, boolean> = { EmailForInvoicesKillSwitch: false, ...overrides };

    useFlagMock.mockImplementation((flag: string) => flags[flag] ?? true);
};

const mockUser = (user: Partial<UserModel> = {}) =>
    (useUser as Mock).mockReturnValue([{ isPaid: true, isAdmin: false, Flags: {}, ...user }, false]);

const mockInvoiceEmail = (invoiceEmail: Partial<InvoiceEmailSettings> = {}) =>
    mockUseOrganization([
        {
            Settings: {
                InvoiceEmail: null,
                InvoiceEmailState: INVOICE_EMAIL_STATE.DISABLED,
                ...invoiceEmail,
            } as OrganizationSettings,
        },
    ]);

const InvoiceOptionsSectionContext = applyHOCs(
    withConfig(),
    withNotifications(),
    withReduxStore()
)(InvoiceOptionsSection);

describe('InvoiceOptionsSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUser();
        mockFlags();
        mockInvoiceEmail();
    });

    it('should show the billing address and invoice note buttons without a dropdown', () => {
        const { getByTestId, queryByTestId } = render(<InvoiceOptionsSectionContext />);

        expect(queryByTestId('invoiceOptions')).not.toBeInTheDocument();
        expect(getByTestId('editBillingAddress')).toBeInTheDocument();
        expect(getByTestId('editInvoiceNote')).toBeInTheDocument();
    });

    it('should show the invoice email button to admins', () => {
        mockUser({ isAdmin: true });
        const { getByTestId } = render(<InvoiceOptionsSectionContext />);

        expect(getByTestId('setInvoiceEmail')).toBeInTheDocument();
    });

    it('should hide the invoice email button from members', () => {
        const { queryByTestId } = render(<InvoiceOptionsSectionContext />);

        expect(queryByTestId('setInvoiceEmail')).not.toBeInTheDocument();
    });

    it('should hide the invoice email button when the kill switch is on', () => {
        mockUser({ isAdmin: true });
        mockFlags({ EmailForInvoicesKillSwitch: true });
        const { queryByTestId } = render(<InvoiceOptionsSectionContext />);

        expect(queryByTestId('setInvoiceEmail')).not.toBeInTheDocument();
    });

    it('should mark the invoice email as set when invoices are sent by email', () => {
        mockUser({ isAdmin: true });
        mockInvoiceEmail({ InvoiceEmail: 'billing@company.com', InvoiceEmailState: INVOICE_EMAIL_STATE.ENABLED });
        const { getByTestId } = render(<InvoiceOptionsSectionContext />);

        expect(getByTestId('setInvoiceEmailSelected')).toBeInTheDocument();
    });
});
