import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms/Href/Href';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import { updateLocale as updateLocaleConfig } from '@proton/shared/lib/api/settings';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

interface Props {
    locales: TtagLocaleMap;
}

const LanguageSection = ({ locales = {} }: Props) => {
    const { LOCALES = {} } = useConfig();
    const dispatch = useDispatch();
    const [userSettings] = useUserSettings();
    const api = useApi();
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();

    const handleChange = async (locale: string) => {
        try {
            // Ignore API failures on update
            api(updateLocaleConfig(locale)).catch(noop);
            const { update } = await loadLocales({ locale, locales, userSettings });
            if (update) {
                dispatch(userSettingsActions.update({ UserSettings: { Locale: locale } }));
                invokeInboxDesktopIPC({ type: 'updateLocale', payload: locale }).catch(noop);
                createNotification({ text: c('Success').t`Locale updated` });
            }
        } catch (e) {
            errorHandler(e);
        }
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
                    onChange={({ value }) => {
                        handleChange(value);
                    }}
                    aria-describedby="label-languageSelect"
                >
                    {Object.entries(LOCALES).map(([key, value]) => (
                        <Option key={key} title={value} value={key} />
                    ))}
                </SelectTwo>
                <div className="mt-1 text-sm">
                    <Href href={getBlogURL('/translation-community')}>{c('Link').t`Help translate`}</Href>
                </div>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default LanguageSection;
