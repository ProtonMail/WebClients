import { render, screen } from '@testing-library/react';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';
import useFlag from '@proton/unleash/useFlag';

import BreachAlertsSecurityCenter from './BreachAlertsSecurityCenter';

jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    }),
}));

jest.mock('@proton/react-redux-store', () => ({
    __esModule: true,
    baseUseDispatch: jest.fn(),
    baseUseSelector: jest.fn(),
}));

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({ call: jest.fn() }),
}));

jest.mock('@proton/hooks', () => ({
    __esModule: true,
    useLoading: jest.fn().mockReturnValue([false, jest.fn().mockResolvedValue(() => {})]),
}));

jest.mock('@proton/account/user/hooks');
const mockedUser = useUser as jest.Mock;

jest.mock('@proton/account/userSettings/hooks');
const mockedUserSettings = useUserSettings as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

const mockApi = jest.fn();
jest.mock('@proton/components/hooks/useApi', () => () => mockApi);

jest.mock('@proton/hooks/useLoading', () => () => {
    const withLoading = jest.fn().mockImplementation(async (fn) => {
        return fn();
    });
    return [false, withLoading, jest.fn()];
});
const mockBreachesResponseForFreeUser = {
    Breaches: [],
    Samples: [
        {
            id: {
                decrypted: 2,
            },
            name: 'temacessorios.com.br',
            email: 'mailplus@landsteiner.proton.black',
            severity: 0.0,
            created_at: '2022-01-25T00:00:00+00:00',
            source: {
                isAggregated: true,
                domain: null,
                category: null,
                country: null,
            },
            published_at: '2022-01-25T00:00:00+00:00',
            size: 17000,
            exposed_data: [],
            resolved_state: 3,
        },
    ],
    IsEligible: false,
    Count: 5,
};

const mockBreachesResponseForPaidUser = {
    Breaches: [
        {
            id: {
                decrypted: 2,
            },
            email: 'mailplus@landsteiner.proton.black',
            resolvedState: 2,
            severity: 1,
            name: 'Varias fuentes',
            createdAt: '2022-04-13T00:00:00+00:00',
            publishedAt: '2022-04-13T00:00:00+00:00',
            source: {
                isAggregated: true,
                domain: null,
                category: null,
                country: null,
            },
            size: null,
            exposedData: [],
            passwordLastChars: '**word',
        },
    ],
    Samples: [],
    IsEligible: true,
    Count: 1,
};

const setupApiMock = (response: any) => {
    mockApi.mockResolvedValue(response);
};

describe('BreachAlertsSecurityCenter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApi.mockReset();
        setupApiMock(mockBreachesResponseForFreeUser);
    });

    describe('without campaign', () => {
        beforeEach(() => {
            mockUseFlag.mockImplementation((flag: string) => flag !== 'DwmTrialFree2025');
        });

        it('Should display the upsell if the user is free', async () => {
            setupApiMock(mockBreachesResponseForFreeUser);
            mockedUser.mockReturnValue([{ isPaid: false, hasPaidVpn: false }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);

            await screen.findByText(/temacessorios.com.br/i);
            const freeUserSection = screen.getByTestId('breach-alert:free:upsell');
            expect(freeUserSection).toBeInTheDocument();
        });

        it('Should not display the upsell if the user is unlimited', async () => {
            setupApiMock(mockBreachesResponseForPaidUser);
            mockedUser.mockReturnValue([{ isPaid: true, hasPaidVpn: true }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);

            await screen.findByText(/mailplus@landsteiner.proton.black/i);

            const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
            expect(freeUserSection).not.toBeInTheDocument();
        });

        it('Should not display the upsell if the user has paid Pass', async () => {
            setupApiMock(mockBreachesResponseForPaidUser);
            mockedUser.mockReturnValue([{ isPaid: false, hasPaidPass: true }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);

            await screen.findByText(/mailplus@landsteiner.proton.black/i);
            const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
            expect(freeUserSection).not.toBeInTheDocument();
        });
    });

    describe('with campaign', () => {
        beforeEach(() => {
            mockUseFlag.mockReturnValue(true);
        });

        it('Should display the upsell if the user is free', async () => {
            setupApiMock(mockBreachesResponseForPaidUser);
            mockedUser.mockReturnValue([{ isPaid: false, hasPaidVpn: false }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);

            await screen.findByText(/mailplus@landsteiner.proton.black/i);
            const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
            expect(freeUserSection).not.toBeInTheDocument();
        });

        it('Should not display the upsell if the user is unlimited', async () => {
            setupApiMock(mockBreachesResponseForPaidUser);
            mockedUser.mockReturnValue([{ isPaid: true, hasPaidVpn: true }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);

            await screen.findByText(/mailplus@landsteiner.proton.black/i);
            const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
            expect(freeUserSection).not.toBeInTheDocument();
        });

        it('Should not display the upsell if the user has paid Pass', async () => {
            setupApiMock(mockBreachesResponseForPaidUser);
            mockedUser.mockReturnValue([{ isPaid: false, hasPaidPass: true }]);
            mockedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

            render(<BreachAlertsSecurityCenter />);
            await screen.findByText(/mailplus@landsteiner.proton.black/i);
            const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
            expect(freeUserSection).not.toBeInTheDocument();
        });
    });
});
