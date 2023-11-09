import { useEffect, useState } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KeyTransparencyActivation, MailSettings } from '@proton/shared/lib/interfaces';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';

import { useAuthentication, useConfig, useFeature, useGetMailSettings } from '../../hooks';
import { FeatureCode } from '../features';
import { KT_FF, KtFeatureEnum, isKTActive } from './ktStatus';

const getKTActivation = (
    featureFlag: KT_FF,
    appName: APP_NAMES,
    mailSettings?: MailSettings
): KeyTransparencyActivation => {
    if (!featureFlag) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (!isKTActive(featureFlag)) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (featureFlag == KtFeatureEnum.ENABLE_CORE) {
        return KeyTransparencyActivation.LOG_ONLY;
    }
    if (featureFlag == KtFeatureEnum.ENABLE_UI) {
        if (appName === APPS.PROTONMAIL) {
            if (mailSettings?.KT === KEY_TRANSPARENCY_SETTING.ENABLED) {
                return KeyTransparencyActivation.SHOW_UI;
            } else {
                return KeyTransparencyActivation.LOG_ONLY;
            }
        }
        return KeyTransparencyActivation.SHOW_UI;
    }
    return KeyTransparencyActivation.DISABLED;
};

const getKTFeatureCode = (appName: APP_NAMES): FeatureCode | undefined => {
    switch (appName) {
        case APPS.PROTONMAIL:
            return FeatureCode.KeyTransparencyMail;
        case APPS.PROTONACCOUNT:
            return FeatureCode.KeyTransparencyAccount;
        case APPS.PROTONCALENDAR:
            return FeatureCode.KeyTransparencyCalendar;
        case APPS.PROTONDRIVE:
            return FeatureCode.KeyTransparencyDrive;
    }
};

const useKTActivation = (): KeyTransparencyActivation => {
    const { APP_NAME: appName } = useConfig();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const featureCode = getKTFeatureCode(appName);
    const { feature } = useFeature<KT_FF>(featureCode ?? FeatureCode.KeyTransparencyAccount);
    const featureFlag = featureCode ? feature?.Value : undefined;
    const [ktActivation, setKTActivation] = useState(KeyTransparencyActivation.DISABLED);
    const getMailSettings = useGetMailSettings();

    useEffect(() => {
        const run = async () => {
            const mailSettings = isAuthenticated ? await getMailSettings() : undefined;
            const ktActivation = getKTActivation(featureFlag, appName, mailSettings);
            setKTActivation(ktActivation);
        };
        void run();
    }, [featureFlag, appName, isAuthenticated, getMailSettings]);

    return ktActivation;
};

export default useKTActivation;
