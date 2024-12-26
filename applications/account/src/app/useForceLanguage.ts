import { useEffect } from 'react';

import { useForceRefresh } from '@proton/components';
import { languageCode } from '@proton/shared/lib/i18n';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import { locales } from '@proton/shared/lib/i18n/locales';

const useForceLanguage = () => {
    const forceRefresh = useForceRefresh();

    useEffect(() => {
        if (languageCode === 'en') {
            return;
        }
        // Force english until more languages are translated
        const locale = 'en';
        const run = async () => {
            const { update } = await loadLocales({ locale, locales, userSettings: undefined });
            if (update) {
                forceRefresh();
            }
        };
        run();
    }, []);
};

export default useForceLanguage;
