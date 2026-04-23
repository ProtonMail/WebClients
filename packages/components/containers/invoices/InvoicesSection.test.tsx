import { fireEvent, render } from '@testing-library/react';

import useEventManager from '@proton/components/hooks/useEventManager';
import { APPS } from '@proton/shared/lib/constants';
import { applyHOCs, withConfig, withNotifications, withReduxStore } from '@proton/testing';

import useApiResult from '../../hooks/useApiResult';
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

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const InvoicesSectionContext = applyHOCs(withConfig(), withNotifications(), withReduxStore())(InvoicesSection);

describe('InvoicesSection', () => {
    let subscribeMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
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

    it('should always show the "Edit billing address" button, even with no invoices', () => {
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(getByTestId('editBillingAddress')).toBeInTheDocument();
    });

    it('should not show the "Edit invoice note" entry when there are no invoices', () => {
        subscribeMock.mockImplementation(() => () => {});
        const { queryByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        // With a single action, DropdownActions renders as a plain button and no dropdown trigger
        expect(queryByTestId('dropdownActions:dropdown')).not.toBeInTheDocument();
        expect(queryByTestId('editInvoiceNote')).not.toBeInTheDocument();
    });

    it('should show the "Edit invoice note" entry when on the invoices tab and invoices exist', () => {
        (useApiResult as jest.Mock).mockReturnValue({
            result: { Invoices: [{ ID: '123' }], Transactions: [], Total: 1 },
            request: () => requestMock(),
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, getAllByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        expect(getByTestId('editBillingAddress')).toBeInTheDocument();
        // Open the dropdown containing the additional "Edit invoice note" action (the first
        // dropdown trigger in the DOM is the top-level one, rendered before invoice rows).
        fireEvent.click(getAllByTestId('dropdownActions:dropdown')[0]);
        expect(getByTestId('editInvoiceNote')).toBeInTheDocument();
    });

    it('should not show the "Edit invoice note" entry when switching to the credit note tab', () => {
        (useApiResult as jest.Mock).mockReturnValue({
            result: { Invoices: [{ ID: '123' }], Transactions: [], Total: 1 },
            request: () => requestMock(),
        });
        subscribeMock.mockImplementation(() => () => {});
        const { getByTestId, queryByTestId } = render(<InvoicesSectionContext app={APPS.PROTONMAIL} />);

        fireEvent.click(getByTestId('credit-note-tab'));

        // Billing address is still shown, but since the active hook is no longer 'invoices',
        // the "Edit invoice note" action is filtered out, leaving just a single button.
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
