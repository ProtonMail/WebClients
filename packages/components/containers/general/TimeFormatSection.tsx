import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updateTimeFormat } from '@proton/shared/lib/api/settings';
import { dateLocaleCode } from '@proton/shared/lib/i18n';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale } from '@proton/shared/lib/i18n/loadLocale';
import { SETTINGS_TIME_FORMAT, type UserSettings } from '@proton/shared/lib/interfaces';
import { getDefaultTimeFormat } from '@proton/shared/lib/settings/helper';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { getAutomaticText } from './helper';

const TimeSection = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleTimeFormat = async (value: SETTINGS_TIME_FORMAT) => {
        await loadDateLocale(dateLocaleCode, getBrowserLocale(), { ...userSettings, TimeFormat: value });
        const { UserSettings } = await api<{ UserSettings: UserSettings }>(updateTimeFormat(value));
        dispatch(userSettingsActions.set({ UserSettings }));
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timeFormats = [
        { title: '1:00pm', value: SETTINGS_TIME_FORMAT.H12 },
        { title: '13:00', value: SETTINGS_TIME_FORMAT.H24 },
    ];

    const [h12, h24] = timeFormats;

    const defaultFormat = getDefaultTimeFormat() === SETTINGS_TIME_FORMAT.H12 ? h12.title : h24.title;

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="time-format-select" id="label-time-format">
                    {c('Label').t`Time format`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <SelectTwo
                    id="time-format-select"
                    value={userSettings.TimeFormat}
                    loading={loading}
                    onChange={({ value }) => withLoading(handleTimeFormat(value))}
                    aria-describedby="label-time-format"
                >
                    {[
                        {
                            title: getAutomaticText(defaultFormat),
                            value: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
                        },
                        ...timeFormats,
                    ].map((option) => (
                        <Option key={option.value} {...option} />
                    ))}
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default TimeSection;
