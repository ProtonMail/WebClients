import { Button } from '@proton/atoms/Button';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { AppLink, Icon, useConfig } from '../..';

interface Props {
    appToLinkTo?: APP_NAMES;
}

const InboxDesktopAppSwitcher = ({ appToLinkTo }: Props) => {
    const { APP_NAME } = useConfig();
    const isAppMail = APP_NAME === APPS.PROTONMAIL || APPS.PROTONMAIL === appToLinkTo;
    const isAppCalendar = APP_NAME === APPS.PROTONCALENDAR || APPS.PROTONCALENDAR === appToLinkTo;

    return (
        <div className="flex flex-col gap-2">
            <AppLink to="/" toApp={APPS.PROTONMAIL} target="_blank">
                <Button shape="ghost" size="small" className={clsx(isAppMail && 'bg-weak')}>
                    <Icon name="inbox" className={clsx(isAppMail ? 'color-norm' : 'color-weak')} strokeWidth={2} />
                </Button>
            </AppLink>
            <AppLink to="/" toApp={APPS.PROTONCALENDAR} target="_blank">
                <Button shape="ghost" size="small" className={clsx(isAppCalendar && 'bg-weak')}>
                    <Icon
                        name="calendar-grid"
                        className={clsx(isAppCalendar ? 'color-norm' : 'color-weak')}
                        strokeWidth={2}
                    />
                </Button>
            </AppLink>
        </div>
    );
};

export default InboxDesktopAppSwitcher;
