import { render } from '@testing-library/react';

import { ThemeColor } from '@proton/colors/types';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { baseUseSelector } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash';

import SecurityCenterDrawerAppButton from '../drawerAppButtons/SecurityCenterDrawerAppButton';
import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectHasAccountSecurityIssue,
} from '../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import { selectUnreadBreachesCount } from '../views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';

jest.mock('../views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice', () => ({
    selectUnreadBreachesCount: jest.fn(),
}));

jest.mock('@proton/unleash', () => ({
    useFlag: jest.fn(),
}));

jest.mock('../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice', () => ({
    selectHasAccountSecurityIssue: jest.fn(),
    selectAccountSecurityElements: jest.fn(),
    selectHasAccountSecurityIssuesCount: jest.fn(),
}));

jest.mock('@proton/react-redux-store', () => ({
    baseUseSelector: jest.fn(),
}));

jest.mock('@proton/components/hooks', () => ({
    useDrawer: jest.fn(),
}));

jest.mock('../views/SecurityCenter/useSecurityCenter', () => jest.fn());
jest.mock('@proton/components/components/drawer/drawerAppButtons/DrawerAppButton', () => jest.fn(() => null));
jest.mock('../views/SecurityCenter/BreachAlertsSpotlight', () => jest.fn(({ children }) => <div>{children}</div>));
jest.mock('../drawerIcons/SecurityCenterDrawerLogo', () => ({
    SecurityCenterDrawerLogo: jest.fn(() => <div>SecurityCenterDrawerLogo</div>),
}));

const setupMocks = ({
    canDisplayBreachNotifications = true,
    canDisplayNewSentinelSettings = true,
    hasSentinelEnabled = true,
    recoveryPhraseSet = false,
    hasAccountSecurityWarning = true,
    accountSecurityCardsCount = 2, //account and data
    unreadBreachesCount = 3,
    isSecurityCenterEnabled = true,
} = {}) => {
    (useFlag as jest.Mock).mockImplementation((flag: string) => {
        if (flag === 'BreachAlertsNotificationsCommon') {
            return canDisplayBreachNotifications;
        }
        if (flag === 'SentinelRecoverySettings') {
            return canDisplayNewSentinelSettings;
        }
    });

    (baseUseSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
        switch (selector) {
            case selectHasAccountSecurityIssue:
                return hasAccountSecurityWarning;
            case selectAccountSecurityIssuesCount:
                return accountSecurityCardsCount;
            case selectUnreadBreachesCount:
                return unreadBreachesCount;
            case selectAccountSecurityElements:
                return {
                    recoveryPhraseSet,
                    hasSentinelEnabled,
                };
            default:
                return null;
        }
    });

    (useDrawer as jest.Mock).mockReturnValue({
        toggleDrawerApp: jest.fn(),
    });

    (useSecurityCenter as jest.Mock).mockReturnValue(isSecurityCenterEnabled);
};

describe('SecurityCenterDrawerAppButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (props = {}) => render(<SecurityCenterDrawerAppButton {...props} />);

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel enabled', () => {
        setupMocks();

        renderComponent();

        expect(DrawerAppButton).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Danger,
                notificationDotCounter: 4, // unreadBreachesCount + 1 (for recoveryPhraseSet false and canDisplayNewSentinelSettings true)
            }),
            {}
        );
    });

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel not enabled', () => {
        setupMocks({ hasSentinelEnabled: false });

        renderComponent();

        expect(DrawerAppButton).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Warning,
                notificationDotCounter: 5, // unreadBreachesCount + accountSecurityCardsCount (for recoveryPhraseSet false and canDisplayNewSentinelSettings true)
            }),
            {}
        );
    });

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel enabled and recovery set', () => {
        setupMocks({ recoveryPhraseSet: true });

        renderComponent();

        expect(DrawerAppButton).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Warning,
                notificationDotCounter: 3, // unreadBreachesCount + 0
            }),
            {}
        );
    });

    test('passes undefined notificationDotCounter if canDisplayBreachNotifications is false', () => {
        setupMocks({ canDisplayBreachNotifications: false });

        renderComponent();

        expect(DrawerAppButton).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationDotCounter: undefined, // because canDisplayBreachNotifications is false
            }),
            {}
        );
    });

    test('renders null if security center is not enabled', () => {
        setupMocks({ isSecurityCenterEnabled: false });

        const { container } = renderComponent();

        expect(container.firstChild).toBeNull();
    });
});
