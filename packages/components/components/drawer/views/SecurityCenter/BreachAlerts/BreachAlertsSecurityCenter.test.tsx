import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';

import BreachAlertsSecurityCenter from './BreachAlertsSecurityCenter';

vi.mock('@proton/app-context/useNotifications', () => ({
    __esModule: true,
    useNotifications: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('../../../../../containers/credentialLeak/useBreaches', () => ({
    __esModule: true,
    useBreaches: vi.fn().mockReturnValue({ breaches: [], actions: vi.fn() }),
}));

vi.mock('@proton/react-redux-store/ProtonStoreContext', () => ({
    __esModule: true,
    baseUseDispatch: vi.fn(),
    baseUseSelector: vi.fn(),
    baseUseStore: vi.fn(),
}));

vi.mock('../../../../../hooks/useEventManager', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({ call: vi.fn() }),
}));

vi.mock('@proton/hooks/useLoading', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue([false, vi.fn().mockResolvedValue(() => {})]),
}));

vi.mock('@proton/account/user/hooks');
const mockedUser = useUser as Mock;

vi.mock('@proton/account/userSettings/hooks');
const mocedUserSettings = useUserSettings as Mock;

describe('BreachAlertsSecurityCenter', () => {
    it('Should display the upsell if the user is free', () => {
        mockedUser.mockReturnValue([{ isPaid: false, hasPaidVpn: false }]);
        mocedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

        render(<BreachAlertsSecurityCenter />);
        const freeUserSection = screen.getByTestId('breach-alert:free:upsell');
        expect(freeUserSection).toBeInTheDocument();
    });

    it('Should not display the upsell if the user is unlimited', () => {
        mockedUser.mockReturnValue([{ isPaid: true, hasPaidVpn: true }]);
        mocedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

        render(<BreachAlertsSecurityCenter />);
        const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
        expect(freeUserSection).not.toBeInTheDocument();
    });

    it('Should not display the upsell if the user has paid Pass', () => {
        mockedUser.mockReturnValue([{ isPaid: false, hasPaidPass: true }]);
        mocedUserSettings.mockReturnValue([{ BreachAlerts: { Value: 1 } }]);

        render(<BreachAlertsSecurityCenter />);
        const freeUserSection = screen.queryByTestId('breach-alert:free:upsell');
        expect(freeUserSection).not.toBeInTheDocument();
    });
});
