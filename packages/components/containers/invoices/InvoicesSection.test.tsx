import { render } from '@testing-library/react';

import { useSubscribeEventManager } from '../../hooks';
import InvoicesSection from './InvoicesSection';

jest.mock('../../hooks/useHandler', () => {
    return {
        __esModule: true,
        ...jest.requireActual('../../hooks/useHandler'),
        useSubscribeEventManager: jest.fn(),
    };
});

let requestMock: jest.Mock;
jest.mock('../../hooks/useApiResult', () => {
    let request = jest.fn();
    requestMock = request;

    return {
        __esModule: true,
        ...jest.requireActual('../../hooks/useApiResult'),
        default: jest.fn().mockReturnValue({
            request,
        }),
    };
});

jest.mock('../../hooks/useUser', () => {
    return {
        __esModule: true,
        default: jest.fn().mockReturnValue([
            {
                isPaid: false,
            },
        ]),
    };
});

jest.mock('../../hooks/useSubscription', () => {
    return {
        __esModule: true,
        default: jest.fn().mockReturnValue([]),
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

describe('InvoicesSection', () => {
    let useSubscribeEventManagerMock: jest.Mock;

    beforeAll(() => {
        useSubscribeEventManagerMock = useSubscribeEventManager as jest.Mock;
    });

    beforeEach(() => {
        requestMock.mockReset();
        useSubscribeEventManagerMock.mockReset();
    });

    it('should request the list of invoices again when there is an Invoices event', () => {
        render(<InvoicesSection />);

        expect(useSubscribeEventManagerMock).toHaveBeenCalledTimes(1);
        let [callback] = useSubscribeEventManagerMock.mock.lastCall;

        callback({
            Invoices: [{ ID: '123' }],
        });

        expect(requestMock).toHaveBeenCalledTimes(1);
    });

    it('should not request invoices if the Invoices array is empty', () => {
        render(<InvoicesSection />);

        expect(useSubscribeEventManagerMock).toHaveBeenCalledTimes(1);
        let [callback] = useSubscribeEventManagerMock.mock.lastCall;

        callback({
            Invoices: [],
        });

        expect(requestMock).toHaveBeenCalledTimes(0);
    });

    it('should not request invoices if the Invoices are not there ', () => {
        render(<InvoicesSection />);

        let useSubscribeEventManagerMock = useSubscribeEventManager as jest.Mock;
        expect(useSubscribeEventManagerMock).toHaveBeenCalledTimes(1);
        let [callback] = useSubscribeEventManagerMock.mock.lastCall;

        callback({});

        expect(requestMock).toHaveBeenCalledTimes(0);
    });

    it('should not request invoices if the callback does not have an argument', () => {
        render(<InvoicesSection />);

        let useSubscribeEventManagerMock = useSubscribeEventManager as jest.Mock;
        expect(useSubscribeEventManagerMock).toHaveBeenCalledTimes(1);
        let [callback] = useSubscribeEventManagerMock.mock.lastCall;

        callback();

        expect(requestMock).toHaveBeenCalledTimes(0);
    });
});
