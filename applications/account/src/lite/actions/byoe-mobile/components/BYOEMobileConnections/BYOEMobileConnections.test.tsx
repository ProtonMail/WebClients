import { act, fireEvent, render, screen } from '@testing-library/react';

import { BYOEMobileConnections } from './BYOEMobileConnections';

const mockLoadDashboard = jest.fn();
jest.mock('@proton/activation/src/logic/actions', () => ({
    loadDashboard: () => mockLoadDashboard(),
}));

const mockDispatch = jest.fn();
jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: () => mockDispatch,
}));

jest.mock('@proton/activation/src/hooks/useBYOEAddresses', () => ({
    useBYOEAddresses: () => ({ addresses: [], loading: false }),
}));

jest.mock('./BYOEAddresses', () => ({ BYOEAddresses: () => <div>addresses</div> }));
jest.mock('./BYOEImports', () => ({ BYOEImports: () => <div>imports</div> }));

const buildRequest = (promise: Promise<void>) => Object.assign(promise, { unwrap: () => promise, abort: jest.fn() });

const flush = () => act(() => jest.advanceTimersByTimeAsync(1000));

describe('BYOEMobileConnections', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockDispatch.mockImplementation((request) => request);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('Should display the content once loaded', async () => {
        mockLoadDashboard.mockReturnValue(buildRequest(Promise.resolve()));
        render(<BYOEMobileConnections />);

        await flush();

        screen.getByText('addresses');
        screen.getByText('imports');
    });

    it('Should display the error state when loading fails', async () => {
        mockLoadDashboard.mockReturnValue(buildRequest(Promise.reject(new Error('failed'))));
        render(<BYOEMobileConnections />);

        await flush();

        screen.getByText("Couldn't load your connections");
        expect(screen.queryByText('addresses')).toBeNull();
    });

    it('Should load again on retry', async () => {
        mockLoadDashboard.mockReturnValueOnce(buildRequest(Promise.reject(new Error('failed'))));
        mockLoadDashboard.mockReturnValueOnce(buildRequest(Promise.resolve()));
        render(<BYOEMobileConnections />);
        await flush();

        fireEvent.click(screen.getByText('Try again'));
        await flush();

        expect(mockLoadDashboard).toHaveBeenCalledTimes(2);
        screen.getByText('addresses');
        expect(screen.queryByText("Couldn't load your connections")).toBeNull();
    });
});
