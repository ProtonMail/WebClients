import { settings } from 'proton-pass-web/lib/settings';

import { authStore } from '@proton/pass/lib/auth/store';
import { createI18nService } from '@proton/pass/lib/i18n/service';
import noop from '@proton/utils/noop';

import locales from '../app/locales';

export const i18n = createI18nService({
    locales,
    getLocale: async () => (await settings.resolve()).locale,
    onLocaleChange: (locale) => {
        if (authStore.hasSession()) {
            settings
                .resolve()
                .then((localSettings) => settings.sync({ ...localSettings, locale }))
                .catch(noop);
        }
    },
});
