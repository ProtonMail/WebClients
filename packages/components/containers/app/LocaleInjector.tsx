import { useEffect } from 'react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import busy, { domIsBusy } from '@proton/shared/lib/busy';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import { locales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

interface Props {
    onRerender?: () => void;
}

const LocaleInjector = ({ onRerender }: Props) => {
    const [userSettings] = useUserSettings();

    useEffect(() => {
        // When busy, the locale update is treated as dangerous and is ignored.
        // This because it's uncertain that applications can properly handle force re-renders while actions are taking place.
        if (domIsBusy() || busy.getIsBusy()) {
            return;
        }

        (async () => {
            const locale = userSettings?.Locale;
            const { update } = await loadLocales({ locale, locales, userSettings });
            if (update) {
                onRerender?.();
                invokeInboxDesktopIPC({ type: 'updateLocale', payload: locale }).catch(noop);
            }
        })().catch(noop);
    }, [userSettings]);

    return null;
};

export default LocaleInjector;
