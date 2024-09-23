import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import { useConfig } from '@proton/components/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { CHANGE_VIEW_TARGET } from '@proton/shared/lib/desktop/desktopTypes';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import ProductIcon from '../app/ProductIcon';

interface Props {
    appToLinkTo?: APP_NAMES;
}

const INBOX_DESKTOP_APPS = [APPS.PROTONMAIL, APPS.PROTONCALENDAR] as const satisfies APP_NAMES[];

const APP_TO_VIEW_TARGET: { [key in (typeof INBOX_DESKTOP_APPS)[number]]: CHANGE_VIEW_TARGET } = {
    'proton-mail': 'mail',
    'proton-calendar': 'calendar',
};

function InboxDesktopDefaultAppSwitcher({ appToLinkTo: currentApp }: Props) {
    const handleClick = (target: CHANGE_VIEW_TARGET) => {
        invokeInboxDesktopIPC({ type: 'changeView', payload: target });
    };

    return (
        <SimpleDropdown
            type="button"
            hasCaret={false}
            content={<Icon name="app-switch" size={6} className="apps-dropdown-button-icon shrink-0 no-print" />}
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
                            <Button
                                onClick={() => handleClick(APP_TO_VIEW_TARGET[app])}
                                className="text-center text-no-decoration outline-none--at-all apps-dropdown-link p-0"
                                aria-current={current}
                                shape="ghost"
                            >
                                <ProductIcon appToLinkTo={app} current={current} />
                            </Button>
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

    const handleClick = (target: CHANGE_VIEW_TARGET) => {
        invokeInboxDesktopIPC({ type: 'changeView', payload: target });
    };

    return (
        <div className="flex flex-col gap-0.5">
            <ButtonLike
                onClick={() => handleClick('mail')}
                className="flex items-center"
                shape={isAppMail ? 'solid' : 'ghost'}
                aria-current={isAppMail}
            >
                <Icon name="inbox" alt={MAIL_APP_NAME} className={clsx(isAppMail ? 'color-norm' : 'color-weak')} />
            </ButtonLike>
            <ButtonLike
                onClick={() => handleClick('calendar')}
                className="flex items-center"
                shape={isAppCalendar ? 'solid' : 'ghost'}
                aria-current={isAppCalendar}
            >
                <Icon
                    name="calendar-grid"
                    alt={CALENDAR_APP_NAME}
                    className={clsx(isAppCalendar ? 'color-norm' : 'color-weak')}
                />
            </ButtonLike>
        </div>
    );
}

export function InboxDesktopAppSwitcher(props: Props) {
    if (isElectronOnMac) {
        return <InboxDesktopMacAppSwitcher {...props} />;
    }

    return <InboxDesktopDefaultAppSwitcher {...props} />;
}
