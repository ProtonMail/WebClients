import { relocalizeText } from '@proton/shared/lib/i18n/relocalize';
import { useCallback } from 'react';
import useUserSettings from './useUserSettings';

const useRelocalizeText = () => {
    const [userSettings] = useUserSettings();

    return useCallback(
        async ({
            getLocalizedText,
            newLocaleCode,
            relocalizeDateFormat,
        }: {
            getLocalizedText: () => string;
            newLocaleCode?: string;
            relocalizeDateFormat?: boolean;
        }) => {
            return relocalizeText({
                getLocalizedText,
                newLocaleCode,
                relocalizeDateFormat,
                userSettings,
            });
        },
        [userSettings]
    );
};

export default useRelocalizeText;
