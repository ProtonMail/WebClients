import { render, screen } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import SmartBanner from './SmartBanner';

jest.mock('@proton/account/userSettings/hooks', () => ({
    __esModule: true,
    useUserSettings: jest.fn(),
}));

// These values are from USED_CLIENT_FLAGS in '@proton/shared/lib/interfaces'
const userSettings = {
    [APPS.PROTONCALENDAR]: 562949953421312,
    [APPS.PROTONMAIL]: 4503599627370496,
};

const setMockUserSettings = (app: APP_NAMES = APPS.PROTONMAIL) => {
    (useUserSettings as jest.Mock).mockReturnValue([
        { UsedClientFlags: userSettings[app as keyof typeof userSettings] },
    ]);
};

jest.mock('@proton/shared/lib/helpers/browser', () => {
    return {
        isAndroid: jest.fn(),
        isIos: jest.fn(),
        isMobile: jest.fn(),
    };
});

interface SetMockHelpersProps {
    isAndroid: boolean;
    isIos: boolean;
}

const setMockHelpers = (helperResponses: SetMockHelpersProps) => {
    (isAndroid as jest.Mock).mockReturnValue(helperResponses.isAndroid);
    (isIos as jest.Mock).mockReturnValue(helperResponses.isIos);
};

jest.mock('@proton/shared/lib/helpers/usedClientsFlags', () => {
    return {
        isCalendarMobileAppUser: jest.fn(),
        isMailMobileAppUser: jest.fn(),
    };
});

interface SetMockUsedClientsFlag {
    isCalendarMobileAppUser: boolean;
    isMailMobileAppUser: boolean;
}

const setMockUsedClientsFlags = (usedClientsFlagsResponses: SetMockUsedClientsFlag) => {
    (isCalendarMobileAppUser as jest.Mock).mockReturnValue(usedClientsFlagsResponses.isCalendarMobileAppUser);
    (isMailMobileAppUser as jest.Mock).mockReturnValue(usedClientsFlagsResponses.isMailMobileAppUser);
};

const defaultHelperResponses = {
    isAndroid: true,
    isIos: false,
};

const defaultUsedClientsFlagsResponses = {
    isCalendarMobileAppUser: false,
    isMailMobileAppUser: false,
};

const linkRoleOptions = { name: 'Download' };

const storeLinks = {
    [APPS.PROTONCALENDAR]: {
        appStore: 'https://apps.apple.com/app/apple-store/id1514709943?pt=106513916&ct=webapp-calendar-topbanner&mt=8',
        playStore:
            'https://play.google.com/store/apps/details?id=me.proton.android.calendar&utm_source=proton.me&utm_campaign=webapp-calendar-topbanner',
    },
    [APPS.PROTONMAIL]: {
        appStore: 'https://apps.apple.com/app/apple-store/id979659905?pt=106513916&ct=webapp-mail-topbanner&mt=8',
        playStore:
            'https://play.google.com/store/apps/details?id=ch.protonmail.android&utm_source=webapp&utm_campaign=webapp-mail-topbanner',
    },
};

describe('@proton/components/components/SmartBanner', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockUseUser();
    });

    test.each([
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: false, renderOrNot: 'not render', plan: 'paid' },
        { app: APPS.PROTONCALENDAR, isAndroid: true, isIos: false, renderOrNot: 'correctly render', plan: 'paid' },
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: true, renderOrNot: 'correctly render', plan: 'paid' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: false, renderOrNot: 'not render', plan: 'paid' },
        { app: APPS.PROTONMAIL, isAndroid: true, isIos: false, renderOrNot: 'correctly render', plan: 'paid' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: true, renderOrNot: 'correctly render', plan: 'paid' },
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: false, renderOrNot: 'not render', plan: 'free' },
        { app: APPS.PROTONCALENDAR, isAndroid: true, isIos: false, renderOrNot: 'correctly render', plan: 'free' },
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: true, renderOrNot: 'correctly render', plan: 'free' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: false, renderOrNot: 'not render', plan: 'free' },
        { app: APPS.PROTONMAIL, isAndroid: true, isIos: false, renderOrNot: 'correctly render', plan: 'free' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: true, renderOrNot: 'correctly render', plan: 'free' },
    ])(
        'given app is $app, isAndroid is $isAndroid, and isIos is $isIos, should $renderOrNot SmartBanner when user is $plan',
        ({ app, isAndroid, isIos, plan }) => {
            mockUseUser([
                {
                    isFree: plan === 'free',
                    isPaid: plan === 'paid',
                },
            ]);
            setMockHelpers({ ...defaultHelperResponses, isAndroid, isIos });
            setMockUsedClientsFlags(defaultUsedClientsFlagsResponses);
            setMockUserSettings(app);

            render(<SmartBanner app={app} />);

            const canRenderBanner = isAndroid || isIos;

            if (canRenderBanner) {
                const linkToStore = screen.getByRole('link', linkRoleOptions);
                expect(linkToStore).toBeInTheDocument();
                expect(linkToStore).toHaveProperty('href', storeLinks[app][isAndroid ? 'playStore' : 'appStore']);

                const dismissButton = screen.queryByTestId('dismiss-smart-banner');
                if (plan === 'free') {
                    expect(dismissButton).toBe(null);
                } else {
                    expect(dismissButton).toBeDefined();
                }
            } else {
                expect(screen.queryByRole('link', linkRoleOptions)).not.toBeInTheDocument();
            }
        }
    );

    test.each([
        { subtitle: 'The coolest Avenger', title: 'Hawkeye' },
        { subtitle: undefined, title: undefined },
    ])(
        'given title is $title and subtitle is $subtitle, should render SmartBanner with correct text',
        ({ subtitle, title }) => {
            setMockHelpers(defaultHelperResponses);
            setMockUsedClientsFlags(defaultUsedClientsFlagsResponses);
            setMockUserSettings();

            render(<SmartBanner app={APPS.PROTONMAIL} subtitle={subtitle} title={title} />);

            const textBlock = screen.getByRole('paragraph');

            // If no text is passed, default text is rendered.
            expect(textBlock).toHaveTextContent(title ?? 'Private, fast, and organized');
            expect(textBlock).toHaveTextContent(subtitle ?? 'Faster on the app');
        }
    );

    test.each([{ app: APPS.PROTONCALENDAR }, { app: APPS.PROTONMAIL }])(
        'given mobile $app web user has used the native mobile $app app, should not render SmartBanner',
        ({ app }) => {
            setMockHelpers(defaultHelperResponses);
            setMockUsedClientsFlags({
                isCalendarMobileAppUser: app === APPS.PROTONCALENDAR,
                isMailMobileAppUser: app === APPS.PROTONMAIL,
            });
            setMockUserSettings(app);

            render(<SmartBanner app={app} />);

            expect(screen.queryByRole('link', linkRoleOptions)).not.toBeInTheDocument();
        }
    );
});
