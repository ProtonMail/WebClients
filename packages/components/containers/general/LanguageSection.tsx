import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import { IcLanguage } from '@proton/icons/icons/IcLanguage';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateLocale as updateLocaleConfig } from '@proton/shared/lib/api/settings';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import Option from '../../components/option/Option';
import useErrorHandler from '../../hooks/useErrorHandler';
import { SettingsIconRow } from '../account/SettingsIconRow';
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSelectRow } from '../account/SettingsSelectRow';

interface Props {
    locales: TtagLocaleMap;
}

/**
 * Sits below the language card rather than inside its row, so it's exported separately
 * for each page that renders {@link LanguageSection} to place itself.
 */
export const LanguageTranslationHelp = () => {
    const helpTranslateLink = (
        <Href key="help-translate" href={getBlogURL('/translation-community')}>
            {c('Link').t`Help translate`}
        </Href>
    );

    return (
        <SettingsParagraph className="mb-0">
            {c('Info').jt`${helpTranslateLink} by joining our localization community.`}
        </SettingsParagraph>
    );
};

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
        <SettingsIconRow icon={IcLanguage}>
            <SettingsSelectRow
                id="languageSelect"
                label={
                    <SettingsSelectRow.Label id="label-languageSelect">
                        {c('Label').t`Default language`}
                    </SettingsSelectRow.Label>
                }
                select={
                    <SettingsSelectRow.Select
                        value={displayedValue}
                        onChange={({ value }) => {
                            // handleChange reports its own errors
                            void handleChange(value);
                        }}
                        aria-describedby="label-languageSelect"
                    >
                        {Object.entries(LOCALES).map(([key, value]) => (
                            <Option key={key} title={value} value={key} />
                        ))}
                    </SettingsSelectRow.Select>
                }
            />
        </SettingsIconRow>
    );
};

export default LanguageSection;
