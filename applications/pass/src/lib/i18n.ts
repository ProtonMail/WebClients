import { authStore } from '@proton/pass/lib/auth/store';
import { createI18nService } from '@proton/pass/lib/i18n/service';
import { prop } from '@proton/pass/utils/fp/lens';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { settings } from './settings';

export const i18n = (locales: TtagLocaleMap) =>
    createI18nService({
        locales,
        loadDateLocale: true,
        getLocale: () => settings.resolve(authStore.getLocalID()).then(prop('locale')).catch(noop),
        onLocaleChange: (locale) => {
            const localID = authStore.getLocalID();
            if (authStore.hasSession()) {
                settings
                    .resolve(localID)
                    .then((prev) => settings.sync({ ...prev, locale }, localID))
                    .catch(noop);
            }
        },
    });
