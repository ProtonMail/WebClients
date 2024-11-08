import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import useForceRefresh from '@proton/components/hooks/useForceRefresh';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

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
    const forceRefresh = useForceRefresh();

    const languageOptions = Object.entries(LOCALES).map(([key, value]) => (
        <Option key={key} title={value} value={key} />
    ));

    const handleChange = async (locale: string) => {
        await api(updateLocale(locale));
        const localeCode = getClosestLocaleCode(locale, locales);
        await Promise.all([
            loadLocale(localeCode, locales),
            loadDateLocale(localeCode, getBrowserLocale(), userSettings),
        ]);
        await call();
        createNotification({ text: c('Success').t`Locale updated` });
        forceRefresh();
        invokeInboxDesktopIPC({ type: 'updateLocale', payload: locale });
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
                    {languageOptions}
                </SelectTwo>
                <div className="mt-1 text-sm">
                    <Href href={getBlogURL('/translation-community')}>{c('Link').t`Help translate`}</Href>
                </div>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default LanguageSection;
