import { ButtonLike } from '@proton/atoms/Button';
import { AppLink, Icon } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { APPS, APP_NAMES, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

interface Props {
    appToLinkTo?: APP_NAMES;
}

const InboxDesktopAppSwitcher = ({ appToLinkTo }: Props) => {
    const { APP_NAME } = useConfig();
    const isAppMail = APP_NAME === APPS.PROTONMAIL || APPS.PROTONMAIL === appToLinkTo;
    const isAppCalendar = APP_NAME === APPS.PROTONCALENDAR || APPS.PROTONCALENDAR === appToLinkTo;

    return (
        <div className="flex flex-col gap-0.5">
            <ButtonLike
                as={AppLink}
                to="/"
                toApp={APPS.PROTONMAIL}
                target="_blank"
                className="flex items-center"
                shape={isAppMail ? 'solid' : 'ghost'}
                aria-current={isAppMail}
            >
                <Icon name="inbox" alt={MAIL_APP_NAME} className={clsx(isAppMail ? 'color-norm' : 'color-weak')} />
            </ButtonLike>
            <ButtonLike
                as={AppLink}
                to="/"
                toApp={APPS.PROTONCALENDAR}
                target="_blank"
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
