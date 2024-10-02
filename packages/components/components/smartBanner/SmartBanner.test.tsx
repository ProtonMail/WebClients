import { render, screen } from '@testing-library/react';

import { default as defaultUserSettings } from '@proton/components/hooks/useUserSettings';
import { APPS, type APP_NAMES, CALENDAR_MOBILE_APP_LINKS, MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/constants';
import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';
import { isCalendarMobileAppUser, isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';

import SmartBanner from './SmartBanner';

jest.mock('@proton/components/hooks/useUserSettings', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// These values are from USED_CLIENT_FLAGS in '@proton/shared/lib/interfaces'
const userSettings = {
    [APPS.PROTONCALENDAR]: 562949953421312,
    [APPS.PROTONMAIL]: 4503599627370496,
};

const setMockUserSettings = (app: APP_NAMES = APPS.PROTONMAIL) => {
    (defaultUserSettings as jest.Mock).mockReturnValue([
        { UsedClientFlags: userSettings[app as keyof typeof userSettings] },
    ]);
};

jest.mock('@proton/shared/lib/helpers/browser', () => {
    return {
        isAndroid: jest.fn(),
        isIos: jest.fn(),
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
    [APPS.PROTONCALENDAR]: CALENDAR_MOBILE_APP_LINKS,
    [APPS.PROTONMAIL]: MAIL_MOBILE_APP_LINKS,
};

describe('@proton/components/components/SmartBanner', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test.each([
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: false, renderOrNot: 'not render' },
        { app: APPS.PROTONCALENDAR, isAndroid: true, isIos: false, renderOrNot: 'correctly render' },
        { app: APPS.PROTONCALENDAR, isAndroid: false, isIos: true, renderOrNot: 'correctly render' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: false, renderOrNot: 'not render' },
        { app: APPS.PROTONMAIL, isAndroid: true, isIos: false, renderOrNot: 'correctly render' },
        { app: APPS.PROTONMAIL, isAndroid: false, isIos: true, renderOrNot: 'correctly render' },
    ])(
        'given app is $app, isAndroid is $isAndroid, and isIos is $isIos, should $renderOrNot SmartBanner',
        ({ app, isAndroid, isIos }) => {
            setMockHelpers({ ...defaultHelperResponses, isAndroid, isIos });
            setMockUsedClientsFlags(defaultUsedClientsFlagsResponses);
            setMockUserSettings(app);

            render(<SmartBanner app={app} />);

            const canRenderBanner = isAndroid || isIos;

            if (canRenderBanner) {
                const linkToStore = screen.getByRole('link', linkRoleOptions);
                expect(linkToStore).toBeInTheDocument();
                expect(linkToStore).toHaveProperty('href', storeLinks[app][isAndroid ? 'playStore' : 'appStore']);
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
