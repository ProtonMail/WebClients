import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getCalendarsLimitReachedText } from '@proton/shared/lib/calendar/calendarLimits';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { SettingsLink } from '../../components/link';

interface Props {
    onClose?: () => void;
    open?: boolean;
    isFreeUser: boolean;
    user: UserModel;
    subscription?: Subscription;
}

const CalendarLimitReachedModal = ({ open, onClose, isFreeUser, user, subscription }: Props) => {
    const { maxReachedText, addNewCalendarText } = getCalendarsLimitReachedText(isFreeUser);
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: CALENDAR_UPSELL_PATHS.MAX_CAL,
    });
    const upgradeLink = addUpsellPath(getUpgradePath({ user, subscription }), upsellRef);
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
