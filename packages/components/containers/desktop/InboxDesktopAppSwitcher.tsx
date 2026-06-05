import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useConfig from '@proton/components/hooks/useConfig';
import { IcAppSwitch } from '@proton/icons/icons/IcAppSwitch';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { CHANGE_VIEW_TARGET } from '@proton/shared/lib/desktop/desktopTypes';
import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { metaKey } from '@proton/shared/lib/helpers/browser';
import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import ProductIcon from '../app/ProductIcon';

const showShortcutTooltips = hasInboxDesktopFeature('SwitchViewShortcuts');

interface Props {
    appToLinkTo?: APP_NAMES;
}

const INBOX_DESKTOP_APPS = [APPS.PROTONMAIL, APPS.PROTONCALENDAR] as const satisfies APP_NAMES[];

const APP_TO_VIEW_TARGET: { [key in (typeof INBOX_DESKTOP_APPS)[number]]: CHANGE_VIEW_TARGET } = {
    'proton-mail': 'mail',
    'proton-calendar': 'calendar',
};

const APP_TO_TOOLTIP: { [key in (typeof INBOX_DESKTOP_APPS)[number]]: string } = {
    'proton-mail': `${MAIL_APP_NAME} (${metaKey} + 1)`,
    'proton-calendar': `${CALENDAR_APP_NAME} (${metaKey} + 2)`,
};

function InboxDesktopDefaultAppSwitcher({ appToLinkTo: currentApp }: Props) {
    const { APP_NAME } = useConfig();
    const isAppAccount = APP_NAME === APPS.PROTONACCOUNT;

    const handleClick = (target: CHANGE_VIEW_TARGET) => {
        void invokeInboxDesktopIPC({ type: 'changeView', payload: target });
    };

    return (
        <SimpleDropdown
            type="button"
            hasCaret={false}
            content={<IcAppSwitch size={6} className="apps-dropdown-button-icon shrink-0 no-print" />}
            className="apps-dropdown-button shrink-0"
            dropdownClassName="apps-dropdown rounded-lg"
            originalPlacement="bottom-start"
            title={c('Apps dropdown').t`${BRAND_NAME} applications`}
            disableDefaultArrowNavigation
            as="button"
        >
            <ul className="unstyled my-0 p-4" style={{ '--apps-dropdown-repeat': '2' }}>
                {INBOX_DESKTOP_APPS.map((app) => {
                    const current = app === currentApp;

                    return (
                        <li className="dropdown-item apps-dropdown-item" data-testid="apps-dropdown-item" key={app}>
                            <Tooltip
                                title={showShortcutTooltips && !isAppAccount ? APP_TO_TOOLTIP[app] : undefined}
                                originalPlacement="bottom"
                            >
                                <Button
                                    onClick={() => handleClick(APP_TO_VIEW_TARGET[app])}
                                    className="text-center text-no-decoration outline-none--at-all apps-dropdown-link p-0"
                                    aria-current={current}
                                    shape="ghost"
                                    data-testid={`inbox-desktop-switch-${APP_TO_VIEW_TARGET[app]}-app`}
                                >
                                    <ProductIcon appToLinkTo={app} current={current} />
                                </Button>
                            </Tooltip>
                        </li>
                    );
                })}
            </ul>
        </SimpleDropdown>
    );
}

function InboxDesktopMacAppSwitcher({ appToLinkTo }: Props) {
    const { APP_NAME } = useConfig();

    const isAppMail = APP_NAME === APPS.PROTONMAIL || APPS.PROTONMAIL === appToLinkTo;
    const isAppCalendar = APP_NAME === APPS.PROTONCALENDAR || APPS.PROTONCALENDAR === appToLinkTo;
    const isAppAccount = APP_NAME === APPS.PROTONACCOUNT;

    const handleClick = (target: CHANGE_VIEW_TARGET) => {
        void invokeInboxDesktopIPC({ type: 'changeView', payload: target });
    };

    return (
        <div className="flex flex-col gap-0.5">
            <Tooltip
                title={showShortcutTooltips && !isAppAccount ? APP_TO_TOOLTIP[APPS.PROTONMAIL] : undefined}
                originalPlacement="right"
            >
                <ButtonLike
                    onClick={() => handleClick('mail')}
                    className="flex items-center"
                    shape={isAppMail ? 'solid' : 'ghost'}
                    aria-current={isAppMail}
                    data-testid="inbox-desktop-switch-mail-app"
                >
                    <IcInbox alt={MAIL_APP_NAME} className={clsx(isAppMail ? 'color-norm' : 'color-weak')} />
                </ButtonLike>
            </Tooltip>
            <Tooltip
                title={showShortcutTooltips && !isAppAccount ? APP_TO_TOOLTIP[APPS.PROTONCALENDAR] : undefined}
                originalPlacement="right"
            >
                <ButtonLike
                    onClick={() => handleClick('calendar')}
                    className="flex items-center"
                    shape={isAppCalendar ? 'solid' : 'ghost'}
                    aria-current={isAppCalendar}
                    data-testid="inbox-desktop-switch-calendar-app"
                >
                    <IcCalendarGrid
                        alt={CALENDAR_APP_NAME}
                        className={clsx(isAppCalendar ? 'color-norm' : 'color-weak')}
                    />
                </ButtonLike>
            </Tooltip>
        </div>
    );
}

export function InboxDesktopAppSwitcher(props: Props) {
    if (isElectronOnMac) {
        return <InboxDesktopMacAppSwitcher {...props} />;
    }

    return <InboxDesktopDefaultAppSwitcher {...props} />;
}
