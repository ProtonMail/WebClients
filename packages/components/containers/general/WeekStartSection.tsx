import { c } from 'ttag';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';
import { updateWeekStart } from '@proton/shared/lib/api/settings';
import { loadDateLocale } from '@proton/shared/lib/i18n/loadLocale';
import { dateLocaleCode } from '@proton/shared/lib/i18n';
import { getDefaultWeekStartsOn } from '@proton/shared/lib/settings/helper';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';

import { Option, SelectTwo } from '../../components';
import { useApi, useEventManager, useNotifications, useLoading, useUserSettings } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const WeekStartSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleWeekStart = async (value: SETTINGS_WEEK_START) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, WeekStart: value });
        await api(updateWeekStart(value));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const days = [
        { text: c('Day').t`Sunday`, value: SETTINGS_WEEK_START.SUNDAY },
        { text: c('Day').t`Monday`, value: SETTINGS_WEEK_START.MONDAY },
        { text: c('Day').t`Tuesday`, value: SETTINGS_WEEK_START.TUESDAY },
        { text: c('Day').t`Wednesday`, value: SETTINGS_WEEK_START.WEDNESDAY },
        { text: c('Day').t`Thursday`, value: SETTINGS_WEEK_START.THURSDAY },
        { text: c('Day').t`Friday`, value: SETTINGS_WEEK_START.FRIDAY },
        { text: c('Day').t`Saturday`, value: SETTINGS_WEEK_START.SATURDAY },
    ];

    const defaultDay = days[getDefaultWeekStartsOn()].text;

    const [sunday, monday, , , , , saturday] = days;

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="week-start-select">
                    {c('Label').t`Week start`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <SelectTwo
                    id="week-start-select"
                    value={userSettings.WeekStart}
                    loading={loading}
                    onChange={({ value }) => withLoading(handleWeekStart(value))}
                >
                    <Option
                        title={c('Option').t`Automatic (${defaultDay})`}
                        value={SETTINGS_WEEK_START.LOCALE_DEFAULT}
                    />
                    <Option title={sunday.text} value={sunday.value} />
                    <Option title={monday.text} value={monday.value} />
                    <Option title={saturday.text} value={saturday.value} />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default WeekStartSection;
