import { render } from '@testing-library/react';

import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectCanDisplayAccountSecuritySection,
    selectHasAccountSecurityIssue,
    selectUnreadBreachesCount,
} from '@proton/account';
import { ThemeColor } from '@proton/colors/types';
import { baseUseSelector } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash/useFlag';

import SecurityCenterDrawerAppButton from '../drawerAppButtons/SecurityCenterDrawerAppButton';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';
import DrawerAppButton from './DrawerAppButton';

jest.mock('@proton/account', () => ({
    selectUnreadBreachesCount: jest.fn(),
    selectHasAccountSecurityIssue: jest.fn(),
    selectAccountSecurityElements: jest.fn(),
    selectAccountSecurityIssuesCount: jest.fn(),
    selectCanDisplayAccountSecuritySection: jest.fn(),
}));

jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: jest.fn(),
}));

jest.mock('@proton/react-redux-store', () => ({
    baseUseSelector: jest.fn(),
}));

jest.mock('../../../hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../views/SecurityCenter/useSecurityCenter', () => jest.fn());
jest.mock('./DrawerAppButton', () => jest.fn(() => null));
jest.mock('../views/SecurityCenter/BreachAlertsSpotlight', () => jest.fn(({ children }) => <div>{children}</div>));
jest.mock('../drawerIcons/SecurityCenterDrawerLogo', () => ({
    SecurityCenterDrawerLogo: jest.fn(() => <div>SecurityCenterDrawerLogo</div>),
}));

jest.mock('../../../hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        toggleDrawerApp: jest.fn(),
    })),
}));

const setupMocks = ({
    canDisplayBreachNotifications = true,
    hasSentinelEnabled = true,
    recoveryPhraseSet = false,
    hasAccountSecurityWarning = true,
    accountSecurityCardsCount = 2, //account and data
    unreadBreachesCount = 3,
    canDisplayAccountSecurity = true,
    isSecurityCenterEnabled = true,
} = {}) => {
    (useFlag as jest.Mock).mockImplementation((flag: string) => {
        if (flag === 'BreachAlertsNotificationsCommon') {
            return canDisplayBreachNotifications;
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
            case selectCanDisplayAccountSecuritySection:
                return canDisplayAccountSecurity;
            default:
                return null;
        }
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
                notificationDotCounter: 4, // unreadBreachesCount + 1 (for recoveryPhraseSet false)
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
                notificationDotCounter: 5, // unreadBreachesCount + accountSecurityCardsCount (for recoveryPhraseSet false)
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
