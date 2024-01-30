import { createI18nService } from '@proton/pass/lib/i18n/service';

import locales from '../app/locales';
import { settings } from './settings';

export const i18n = createI18nService({
    locales,
    getLocale: async () => (await settings.resolve()).locale,
    onLocaleChange: (locale) => {
        settings.resolve().then((localSettings) =>
            settings.sync({
                ...localSettings,
                locale,
            })
        );
    },
});
