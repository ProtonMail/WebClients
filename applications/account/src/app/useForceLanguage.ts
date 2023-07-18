import { useEffect } from 'react';

import { useForceRefresh } from '@proton/components/hooks';
import { languageCode } from '@proton/shared/lib/i18n';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { locales } from '@proton/shared/lib/i18n/locales';

const useForceLanguage = () => {
    const forceRefresh = useForceRefresh();

    useEffect(() => {
        if (languageCode === 'en') {
            return;
        }
        // Force english until more languages are translated
        const newLocale = 'en';
        const localeCode = getClosestLocaleCode(newLocale, locales);
        const run = async () => {
            await Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, getBrowserLocale())]);
            forceRefresh();
        };
        run();
    }, []);
};

export default useForceLanguage;
