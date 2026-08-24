import { fireEvent, render, screen } from '@testing-library/react';

import MemberUsageColumnPrompt from './MemberUsageColumnPrompt';

const openSubscriptionModal = jest.fn();
jest.mock('../../payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [openSubscriptionModal, false],
}));

const apiMock = jest.fn().mockResolvedValue({});
jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => apiMock,
}));

jest.mock('../../b2bDashboard/VPN/api', () => ({
    updateMonitoringSetting: (enabling: boolean) => ({ __updateMonitoring: enabling }),
}));

jest.mock('../../b2bDashboard/VPN/TogglingMonitoringModal', () => ({
    __esModule: true,
    default: () => <div>toggling-monitoring-modal</div>,
}));

// The upsell modal reads add-on prices from the plans catalogue; give it yearly totals whose
// monthly-equivalent is €9.99 / €39.99 so we don't need the redux store the real hook depends on.
jest.mock('../../../hooks/usePreferredPlansMap', () => ({
    usePreferredPlansMap: () => ({
        plansMapLoading: false,
        preferredCurrency: 'EUR',
        plansMap: {
            '1member-vpnbiz2023': { Pricing: { 12: 11988 } },
            '1ip-vpnbiz2023': { Pricing: { 12: 47988 } },
        },
    }),
}));

jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    ...jest.requireActual('@proton/redux-shared-store/sharedProvider'),
    useDispatch: () => () => Promise.resolve(undefined),
}));

describe('MemberUsageColumnPrompt', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('opens the gateway-monitor upsell modal and starts the upgrade from it', async () => {
        render(<MemberUsageColumnPrompt state="upsell" />);
        fireEvent.click(screen.getByText('Learn more'));

        const upgradeButton = await screen.findByText('Upgrade to Professional');
        expect(screen.getByText(/User - 9\.99.*month/)).toBeTruthy();
        expect(screen.getByText(/Dedicated server - 39\.99.*month/)).toBeTruthy();

        fireEvent.click(upgradeButton);
        expect(openSubscriptionModal).toHaveBeenCalled();
    });

    it('enables gateway monitoring and confirms from the enable prompt', async () => {
        render(<MemberUsageColumnPrompt state="enable" />);
        fireEvent.click(screen.getByText('Enable'));
        expect(apiMock).toHaveBeenCalledWith({ __updateMonitoring: true });
        await screen.findByText('toggling-monitoring-modal');
    });
});
