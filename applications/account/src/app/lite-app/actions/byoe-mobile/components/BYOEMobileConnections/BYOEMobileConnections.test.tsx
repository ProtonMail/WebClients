import { act, fireEvent, render, screen } from '@testing-library/react';

import { BYOEMobileConnections } from './BYOEMobileConnections';

const mockLoadDashboard = vi.fn();
vi.mock('@proton/activation/src/logic/actions', () => ({
    loadDashboard: () => mockLoadDashboard(),
}));

const mockDispatch = vi.fn();
vi.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: () => mockDispatch,
}));

vi.mock('@proton/activation/src/hooks/useBYOEAddresses', () => ({
    useBYOEAddresses: () => ({ addresses: [], loading: false }),
}));

let mockFlag = true;
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => mockFlag }));

let mockIsBYOEAccount = true;
vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [{}] }));
vi.mock('@proton/shared/lib/keys/accountType', () => ({ getIsBYOEAccount: () => mockIsBYOEAccount }));

vi.mock('./BYOEAddresses', () => ({
    BYOEAddresses: ({ showReminder }: { showReminder?: boolean }) => (
        <div>
            addresses
            {showReminder ? <span>reminder</span> : null}
        </div>
    ),
}));
vi.mock('./BYOEImports', () => ({ BYOEImports: () => <div>imports</div> }));

const buildRequest = (promise: Promise<void>) => Object.assign(promise, { unwrap: () => promise, abort: vi.fn() });

const flush = () => act(() => vi.advanceTimersByTimeAsync(1000));

describe('BYOEMobileConnections', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockFlag = true;
        mockIsBYOEAccount = true;
        mockDispatch.mockImplementation((request) => request);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('Should display the content once loaded', async () => {
        mockLoadDashboard.mockReturnValue(buildRequest(Promise.resolve()));
        render(<BYOEMobileConnections />);

        await flush();

        screen.getByText('addresses', { exact: false });
        screen.getByText('imports');
        screen.getByText('reminder');
    });

    it('Should hide the reminder when the flag is off', async () => {
        mockFlag = false;
        mockLoadDashboard.mockReturnValue(buildRequest(Promise.resolve()));
        render(<BYOEMobileConnections />);

        await flush();

        screen.getByText('imports');
        expect(screen.queryByText('reminder')).toBeNull();
    });

    it('Should hide the reminder when the account is not a BYOE account', async () => {
        mockIsBYOEAccount = false;
        mockLoadDashboard.mockReturnValue(buildRequest(Promise.resolve()));
        render(<BYOEMobileConnections />);

        await flush();

        screen.getByText('imports');
        expect(screen.queryByText('reminder')).toBeNull();
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
        screen.getByText('addresses', { exact: false });
        expect(screen.queryByText("Couldn't load your connections")).toBeNull();
    });
});
