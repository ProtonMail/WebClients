import { c } from 'ttag';

import { updateLocale } from '@proton/shared/lib/api/settings';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';

import { Option, SelectTwo } from '../../components';
import {
    useApi,
    useCache,
    useConfig,
    useEventManager,
    useForceRefresh,
    useLoading,
    useNotifications,
    useUserSettings,
} from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

interface Props {
    locales: TtagLocaleMap;
}

const LanguageSection = ({ locales = {} }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { LOCALES = {} } = useConfig();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const cache = useCache();
    const forceRefresh = useForceRefresh();

    const options = Object.keys(LOCALES).map((value) => ({
        title: LOCALES[value],
        value,
    }));

    const refresh = () => {
        // holidays calendars are fetched translated from back-end, so when language is changed
        // we need to delete the cache key so that on next holidays calendar modal opening,
        // cache will be missed and calendars will be fetched in the new language
        cache.delete(HolidaysCalendarsModel.key);

        forceRefresh();
    };

    const handleChange = async (locale: string) => {
        await api(updateLocale(locale));
        const localeCode = getClosestLocaleCode(locale, locales);
        await Promise.all([
            loadLocale(localeCode, locales),
            loadDateLocale(localeCode, getBrowserLocale(), userSettings),
        ]);
        await call();
        createNotification({ text: c('Success').t`Locale updated` });
        refresh();
    };

    const displayedValue = getClosestLocaleCode(userSettings?.Locale, locales);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="languageSelect" id="label-languageSelect">
                    {c('Label').t`Default language`}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <SelectTwo
                    id="languageSelect"
                    value={displayedValue}
                    disabled={loading}
                    onChange={({ value }) => {
                        void withLoading(handleChange(value));
                    }}
                    aria-describedby="label-languageSelect"
                >
                    {options.map((option) => (
                        <Option key={option.value} {...option} />
                    ))}
                </SelectTwo>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default LanguageSection;
