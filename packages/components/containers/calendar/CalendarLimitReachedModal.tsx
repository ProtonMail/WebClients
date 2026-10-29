import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useSubscriptionForApp } from '@proton/payments-ui/ui/hooks/useSubscriptionForApp';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { getCalendarsLimitReachedText } from '@proton/shared/lib/calendar/calendarLimits';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import SettingsLink from '../../components/link/SettingsLink';
import Prompt from '../../components/prompt/Prompt';

interface Props {
    onClose?: () => void;
    open?: boolean;
    isFreeUser: boolean;
    user: UserModel;
}

const CalendarLimitReachedModal = ({ open, onClose, isFreeUser, user }: Props) => {
    const [subscription] = useSubscriptionForApp(APPS.PROTONCALENDAR);
    const { maxReachedText, addNewCalendarText } = getCalendarsLimitReachedText(isFreeUser);
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: CALENDAR_UPSELL_PATHS.MAX_CAL,
    });
    const upgradeLink = getUpgradePath({ user, subscription }, upsellRef);
    const submitButtonPath = isFreeUser ? upgradeLink : getCalendarsSettingsPath();
    const submitButtonText = isFreeUser ? c('Modal action').t`Upgrade` : c('Modal action').t`Manage calendars`;

    return (
        <Prompt
            open={open}
            title={c('Modal title').t`Cannot add more calendars`}
            buttons={[
                <ButtonLike color="norm" as={SettingsLink} path={submitButtonPath}>
                    {submitButtonText}
                </ButtonLike>,
                <Button onClick={onClose}>{c('Modal action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
        >
            <p>{maxReachedText}</p>
            <p>{addNewCalendarText}</p>
        </Prompt>
    );
};

export default CalendarLimitReachedModal;
