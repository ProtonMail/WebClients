import { c } from 'ttag';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';
import { Toggle } from '../../../components';
import { ToggleProps } from '../../../components/toggle/Toggle';

interface Props extends ToggleProps {
    calendarUserSettings: CalendarUserSettings;
    reverse?: boolean;
}

const AutoDetectPrimaryTimezoneToggle = ({
    calendarUserSettings: { PrimaryTimezone, AutoDetectPrimaryTimezone },
    reverse = false,
    ref,
    ...rest
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingAutoDetect, withLoadingAutoDetect] = useLoading();
    const checked = reverse ? !AutoDetectPrimaryTimezone : !!AutoDetectPrimaryTimezone;

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <Toggle
            {...rest}
            id="autodetect-primary-timezone"
            aria-describedby="autodetect-primary-timezone"
            loading={loadingAutoDetect}
            checked={checked}
            onChange={({ target }) =>
                withLoadingAutoDetect(
                    handleChange({
                        AutoDetectPrimaryTimezone: reverse ? +!target.checked : +target.checked,
                        // Set a timezone if it's the first time
                        PrimaryTimezone: !PrimaryTimezone ? PrimaryTimezone : undefined,
                    })
                )
            }
        />
    );
};

export default AutoDetectPrimaryTimezoneToggle;
