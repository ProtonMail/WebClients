import { ButtonLike } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { APPS, APP_NAMES, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { CHANGE_VIEW_TARGET } from '@proton/shared/lib/desktop/desktopTypes';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import clsx from '@proton/utils/clsx';

interface Props {
    appToLinkTo?: APP_NAMES;
}

const InboxDesktopAppSwitcher = ({ appToLinkTo }: Props) => {
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
};

export default InboxDesktopAppSwitcher;
