import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateLocale as updateLocaleConfig } from '@proton/shared/lib/api/settings';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import useErrorHandler from '../../hooks/useErrorHandler';

interface Props {
    id: string;
    locales: TtagLocaleMap;
    className?: string;
    unstyledSelect?: boolean;
    'aria-labelledby'?: string;
}

const LanguageSelector = ({ id, locales, className, unstyledSelect, 'aria-labelledby': ariaLabelledBy }: Props) => {
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

    return (
        <SelectTwo
            id={id}
            className={className}
            aria-labelledby={ariaLabelledBy}
            unstyled={unstyledSelect}
            value={getClosestLocaleCode(userSettings?.Locale, locales)}
            onChange={({ value }) => {
                // handleChange reports its own errors
                void handleChange(value);
            }}
        >
            {Object.entries(LOCALES).map(([key, value]) => (
                <Option key={key} title={value} value={key} />
            ))}
        </SelectTwo>
    );
};

export default LanguageSelector;
