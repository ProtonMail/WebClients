import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateDateFormat } from '@proton/shared/lib/api/settings';
import { dateLocaleCode } from '@proton/shared/lib/i18n';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale } from '@proton/shared/lib/i18n/loadLocale';
import { SETTINGS_DATE_FORMAT, type UserSettings } from '@proton/shared/lib/interfaces';
import { getDefaultDateFormat } from '@proton/shared/lib/settings/helper';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { getAutomaticText } from './helper';

const DateFormatSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleDateFormat = async (value: SETTINGS_DATE_FORMAT) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, DateFormat: value });
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(updateDateFormat(value));
        dispatch(userSettingsActions.set({ UserSettings }));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const defaultFormat = getDefaultDateFormat()?.toUpperCase();

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="date-format-select" id="label-date-format-select">
                    {c('Label').t`Date format`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <SelectTwo
                    id="date-format-select"
                    value={userSettings.DateFormat}
                    loading={loading}
                    onChange={({ value }) => withLoading(handleDateFormat(value))}
                    aria-describedby="label-date-format-select"
                >
                    <Option title={getAutomaticText(defaultFormat)} value={SETTINGS_DATE_FORMAT.LOCALE_DEFAULT} />
                    <Option title="DD/MM/YYYY" value={SETTINGS_DATE_FORMAT.DDMMYYYY} />
                    <Option title="MM/DD/YYYY" value={SETTINGS_DATE_FORMAT.MMDDYYYY} />
                    <Option title="YYYY/MM/DD" value={SETTINGS_DATE_FORMAT.YYYYMMDD} />
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default DateFormatSection;
