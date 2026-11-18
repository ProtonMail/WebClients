import { render } from '@testing-library/react';
import type { Mock } from 'vitest';

import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectCanDisplayAccountSecuritySection,
    selectHasAccountSecurityIssue,
} from '@proton/account/accountSecurity/accountSecuritySlice';
import { selectUnreadBreachesCount } from '@proton/account/breaches/breachNotificationsSlice';
import { ThemeColor } from '@proton/colors/types';
import { baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import { useFlag } from '@proton/unleash/useFlag';

import SecurityCenterDrawerAppButton from '../drawerAppButtons/SecurityCenterDrawerAppButton';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';
import DrawerAppButton from './DrawerAppButton';

vi.mock('@proton/account/breaches/breachNotificationsSlice', () => ({
    selectUnreadBreachesCount: vi.fn(),
}));

vi.mock('@proton/account/accountSecurity/accountSecuritySlice', () => ({
    selectHasAccountSecurityIssue: vi.fn(),
    selectAccountSecurityElements: vi.fn(),
    selectAccountSecurityIssuesCount: vi.fn(),
    selectCanDisplayAccountSecuritySection: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/react-redux-store/ProtonStoreContext', () => ({
    baseUseSelector: vi.fn(),
}));

vi.mock('../../../hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('../views/SecurityCenter/useSecurityCenter', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('./DrawerAppButton', () => ({ __esModule: true, default: vi.fn(() => null) }));
vi.mock('../views/SecurityCenter/BreachAlertsSpotlight', () => ({
    __esModule: true,
    default: vi.fn(({ children }) => <div>{children}</div>),
}));
vi.mock('../drawerIcons/SecurityCenterDrawerLogo', () => ({
    __esModule: true,
    default: vi.fn(() => <div>SecurityCenterDrawerLogo</div>),
    SecurityCenterDrawerLogo: vi.fn(() => <div>SecurityCenterDrawerLogo</div>),
}));

vi.mock('../../../hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        toggleDrawerApp: vi.fn(),
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
    (useFlag as Mock).mockImplementation((flag: string) => {
        if (flag === 'BreachAlertsNotificationsCommon') {
            return canDisplayBreachNotifications;
        }
    });

    (baseUseSelector as unknown as Mock).mockImplementation((selector: any) => {
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

    (useSecurityCenter as Mock).mockReturnValue(isSecurityCenterEnabled);
};

describe('SecurityCenterDrawerAppButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => render(<SecurityCenterDrawerAppButton {...props} />);

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel enabled', () => {
        setupMocks();

        renderComponent();

        expect(vi.mocked(DrawerAppButton).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Danger,
                notificationDotCounter: 4, // unreadBreachesCount + 1 (for recoveryPhraseSet false)
            })
        );
    });

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel not enabled', () => {
        setupMocks({ hasSentinelEnabled: false });

        renderComponent();

        expect(vi.mocked(DrawerAppButton).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Warning,
                notificationDotCounter: 5, // unreadBreachesCount + accountSecurityCardsCount (for recoveryPhraseSet false)
            })
        );
    });

    test('passes correct notificationDotColor and notificationDotCounter props if Sentinel enabled and recovery set', () => {
        setupMocks({ recoveryPhraseSet: true });

        renderComponent();

        expect(vi.mocked(DrawerAppButton).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({
                notificationDotColor: ThemeColor.Warning,
                notificationDotCounter: 3, // unreadBreachesCount + 0
            })
        );
    });

    test('passes undefined notificationDotCounter if canDisplayBreachNotifications is false', () => {
        setupMocks({ canDisplayBreachNotifications: false });

        renderComponent();

        expect(vi.mocked(DrawerAppButton).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({
                notificationDotCounter: undefined, // because canDisplayBreachNotifications is false
            })
        );
    });

    test('renders null if security center is not enabled', () => {
        setupMocks({ isSecurityCenterEnabled: false });

        const { container } = renderComponent();

        expect(container.firstChild).toBeNull();
    });
});
