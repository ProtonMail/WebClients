import { render } from '@testing-library/react';

import useEventManager from '@proton/components/hooks/useEventManager';
import { applyHOCs, withConfig, withNotifications, withPaymentSwitcherContext, withReduxStore } from '@proton/testing';

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

jest.mock('@proton/components/payments/client-extensions/useChargebeeContext');

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const InvoicesSectionContext = applyHOCs(
    withConfig(),
    withPaymentSwitcherContext(),
    withNotifications(),
    withReduxStore()
)(InvoicesSection);

describe('InvoicesSection', () => {
    let subscribeMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
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
        render(<InvoicesSectionContext />);

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
        render(<InvoicesSectionContext />);

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
        render(<InvoicesSectionContext />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback({});

        expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('should not request invoices if the callback does not have an argument', () => {
        subscribeMock.mockImplementation(() => {
            return () => {};
        });
        render(<InvoicesSectionContext />);

        expect(subscribeMock).toHaveBeenCalledTimes(1);
        const callback = subscribeMock.mock.calls[0][0];

        callback();

        expect(requestMock).toHaveBeenCalledTimes(1);
    });
});
