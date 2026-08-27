import { fireEvent, render } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { APPS, INVOICE_EMAIL_STATE } from '@proton/shared/lib/constants';
import type { InvoiceEmailSettings, OrganizationSettings, UserModel } from '@proton/shared/lib/interfaces';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withConfig } from '@proton/testing/lib/context/hocs/with-config';
import { withNotifications } from '@proton/testing/lib/context/hocs/with-notifications';
import { withReduxStore } from '@proton/testing/lib/context/hocs/with-redux-store';
import { mockUseOrganization } from '@proton/testing/lib/mockUseOrganization';

import useApiResult from '../../hooks/useApiResult';
import useEventManager from '../../hooks/useEventManager';
import InvoicesSection from './InvoicesSection';

jest.mock('../../hooks/useHandler', () => {
    return {
        __esModule: true,
        ...jest.requireActual('../../hooks/useHandler'),
        useSubscribeEventManager: jest.fn(),
    };
});

const requestMock = jest.fn();

jest.mock('../../hooks/useApiResult', () => {
    return {
        __esModule: true,
        ...jest.requireActual('../../hooks/useApiResult'),
        default: jest.fn().mockReturnValue({
            request: () => requestMock(),
        }),
    };
});

jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useUser: jest.fn(() => [{ isPaid: false, Flags: {} }, false]),
    useGetUser: jest.fn(() => [{ isPaid: false, Flags: {} }, false]),
}));

jest.mock('@proton/account/subscription/hooks', () => {
    return {
        __esModule: true,
        useSubscription: jest.fn().mockReturnValue([]),
    };
});

jest.mock('../../hooks/useModals', () => {
    return {
        __esModule: true,
        default: jest.fn().mockReturnValue({
            createModal: jest.fn(),
        }),
    };
});

jest.mock('../../hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const useFlagMock = jest.fn();

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: (flag: string) => useFlagMock(flag),
}));

// Unlisted flags default to on, but a kill switch has to default to off or it would disable the
// very feature these tests exercise.
const mockFlags = (overrides: Record<string, boolean> = {}) => {
    const flags: Record<string, boolean> = { EmailForInvoicesKillSwitch: false, ...overrides };

    useFlagMock.mockImplementation((flag: string) => flags[flag] ?? true);
};

const InvoicesSectionContext = applyHOCs(withConfig(), withNotifications(), withReduxStore())(InvoicesSection);

const mockUser = (user: Partial<UserModel> = {}) =>
    (useUser as jest.Mock).mockReturnValue([{ isPaid: false, isAdmin: false, Flags: {}, ...user }, false]);

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

describe('InvoicesSection', () => {
    let subscribeMock: jest.Mock;

    const renderSection = () => render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

    beforeEach(() => {
        jest.clearAllMocks();
        // mockReturnValue survives clearAllMocks, so reset the defaults explicitly for the tests that
        // override the user (the organization tab is only rendered for paid admins).
        mockUser();
        mockFlags();
        mockInvoiceEmail();
        (useApiResult as jest.Mock).mockReturnValue({
            request: () => requestMock(),
        });
        subscribeMock = jest.fn();
        (useEventManager as jest.Mock).mockReturnValue({
            subscribe: subscribeMock,
        });
    });

    it('should request the list of invoices again when there is an Invoices event', () => {
        subscribeMock.mockImplementation(() => {
            // Simulate immediate subscription
            return () => {};
        });
        render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback({
            Invoices: [{ ID: '123' }],
        });

        expect(requestMock).toHaveBeenCalledTimes(2);
    });

    it('should not request invoices additionally if the Invoices array is empty', () => {
        subscribeMock.mockImplementation(() => {
            return () => {};
        });
        render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback({
            Invoices: [],
        });

        expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('should not request invoices if the Invoices are not there ', () => {
        subscribeMock.mockImplementation(() => {
            return () => {};
        });
        render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback({});

        expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('should always show the "Edit billing address" entry, even with no invoices', () => {
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('editBillingAddress')).toBeInTheDocument();
    });

    it('should always show the "Set invoice email" entry to admins, even with no invoices', () => {
        mockUser({ isAdmin: true });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = renderSection();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('setInvoiceEmail')).toBeInTheDocument();
    });

    it('should hide the "Set invoice email" entry from members', () => {
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = renderSection();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(queryByTestId('setInvoiceEmail')).not.toBeInTheDocument();
    });

    it('should show the bounced email banner when delivery to the invoice email failed', () => {
        mockUser({ isAdmin: true });
        mockInvoiceEmail({
            InvoiceEmail: 'billing@company.com',
            InvoiceEmailState: INVOICE_EMAIL_STATE.BOUNCED,
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = renderSection();

        expect(getByTestId('invoiceEmailBouncedBanner')).toBeInTheDocument();
        expect(getByTestId('updateInvoiceEmail')).toBeInTheDocument();
    });

    it('should not show the bounced email banner when the email is delivering fine', () => {
        mockUser({ isAdmin: true });
        mockInvoiceEmail({
            InvoiceEmail: 'billing@company.com',
            InvoiceEmailState: INVOICE_EMAIL_STATE.ENABLED,
        });
        subscribeMock.mockImplementation(() => () => {});
        const { queryByTestId } = renderSection();

        expect(queryByTestId('invoiceEmailBouncedBanner')).not.toBeInTheDocument();
    });

    it('should not show the bounced email banner to members', () => {
        mockInvoiceEmail({
            InvoiceEmail: 'billing@company.com',
            InvoiceEmailState: INVOICE_EMAIL_STATE.BOUNCED,
        });
        subscribeMock.mockImplementation(() => () => {});
        const { queryByTestId } = renderSection();

        expect(queryByTestId('invoiceEmailBouncedBanner')).not.toBeInTheDocument();
    });

    it('should not show the bounced email banner when the feature flag is off', () => {
        mockUser({ isAdmin: true });
        mockFlags({ EmailForInvoices: false });
        mockInvoiceEmail({
            InvoiceEmail: 'billing@company.com',
            InvoiceEmailState: INVOICE_EMAIL_STATE.BOUNCED,
        });
        subscribeMock.mockImplementation(() => () => {});
        const { queryByTestId } = renderSection();

        expect(queryByTestId('invoiceEmailBouncedBanner')).not.toBeInTheDocument();
    });

    it('should hide the "Set invoice email" entry when the feature flag is off', () => {
        mockUser({ isAdmin: true });
        mockFlags({ EmailForInvoices: false });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = renderSection();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(queryByTestId('setInvoiceEmail')).not.toBeInTheDocument();
    });

    it('should hide the invoice email feature when the kill switch is on', () => {
        mockUser({ isAdmin: true });
        mockFlags({ EmailForInvoices: true, EmailForInvoicesKillSwitch: true });
        mockInvoiceEmail({
            InvoiceEmail: 'billing@company.com',
            InvoiceEmailState: INVOICE_EMAIL_STATE.BOUNCED,
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = renderSection();

        expect(queryByTestId('invoiceEmailBouncedBanner')).not.toBeInTheDocument();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(queryByTestId('setInvoiceEmail')).not.toBeInTheDocument();
    });

    it.each([
        ['emailing is on', INVOICE_EMAIL_STATE.ENABLED],
        // BOUNCED still means emailing is on, it's just failing.
        ['emailing is on but bouncing', INVOICE_EMAIL_STATE.BOUNCED],
    ])('should mark the "Set invoice email" entry as selected when %s', (_, InvoiceEmailState) => {
        mockUser({ isAdmin: true });
        mockInvoiceEmail({ InvoiceEmail: 'billing@company.com', InvoiceEmailState });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = renderSection();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('setInvoiceEmailSelected')).toBeInTheDocument();
    });

    it('should not mark the "Set invoice email" entry as selected when emailing is off', () => {
        mockUser({ isAdmin: true });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = renderSection();

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('setInvoiceEmail')).toBeInTheDocument();
        expect(queryByTestId('setInvoiceEmailSelected')).not.toBeInTheDocument();
    });

    it('should not show the "Edit invoice note" entry when there are no invoices', () => {
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(queryByTestId('editInvoiceNote')).not.toBeInTheDocument();
    });

    it('should show the "Edit invoice note" entry when on the invoices tab and invoices exist', () => {
        (useApiResult as jest.Mock).mockReturnValue({
            result: { Invoices: [{ ID: '123' }], Transactions: [], Total: 1 },
            request: () => requestMock(),
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('editInvoiceNote')).toBeInTheDocument();
    });

    it('should not show the "Edit invoice note" entry when switching to the transactions tab', () => {
        (useApiResult as jest.Mock).mockReturnValue({
            result: { Invoices: [{ ID: '123' }], Transactions: [], Total: 1 },
            request: () => requestMock(),
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        fireEvent.click(getByTestId('transactions-tab'));

        // Billing address is still shown, but since the active hook is no longer 'invoices',
        // the "Edit invoice note" action is filtered out.
        fireEvent.click(getByTestId('invoiceOptions'));
        expect(getByTestId('editBillingAddress')).toBeInTheDocument();
        expect(queryByTestId('editInvoiceNote')).not.toBeInTheDocument();
    });

    it('should not request invoices if the callback does not have an argument', () => {
        subscribeMock.mockImplementation(() => {
            return () => {};
        });
        render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback();

        expect(requestMock).toHaveBeenCalledTimes(1);
    });
});
