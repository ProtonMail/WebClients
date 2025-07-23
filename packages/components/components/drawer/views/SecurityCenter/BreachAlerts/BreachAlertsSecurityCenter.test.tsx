import { render, screen } from '@testing-library/react';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';

import BreachAlertsSecurityCenter from './BreachAlertsSecurityCenter';

jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    }),
}));

jest.mock('@proton/components/containers/credentialLeak/useBreaches', () => ({
    __esModule: true,
    useBreaches: jest.fn().mockReturnValue({ breaches: [], actions: jest.fn() }),
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
const mocedUserSettings = useUserSettings as jest.Mock;

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
