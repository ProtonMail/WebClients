import { useEffect, useState } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KeyTransparencyActivation, KeyTransparencySetting, MailSettings } from '@proton/shared/lib/interfaces';

import { useGetMailSettings } from '../..';
import useConfig from '../../hooks/useConfig';
import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features';
import { KT_FF, isKTActive } from './ktStatus';

const getKTActivationPromise = async (
    featureFlag: KT_FF,
    appName: APP_NAMES,
    mailSettings: MailSettings
): Promise<KeyTransparencyActivation> => {
    if (!featureFlag) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (!(await isKTActive(appName, featureFlag))) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (mailSettings.KT === KeyTransparencySetting.Disabled) {
        return KeyTransparencyActivation.LOG_ONLY;
    }
    if (mailSettings.KT === KeyTransparencySetting.Enabled) {
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
    const featureCode = getKTFeatureCode(appName);
    const { feature } = useFeature<KT_FF>(featureCode ?? FeatureCode.KeyTransparencyAccount);
    const featureFlag = featureCode ? feature?.Value : undefined;
    const [ktActivation, setKTActivation] = useState(KeyTransparencyActivation.DISABLED);
    const getMailSettings = useGetMailSettings();

    useEffect(() => {
        const run = async () => {
            const mailSettings = await getMailSettings();
            const ktActivation = await getKTActivationPromise(featureFlag, appName, mailSettings);
            setKTActivation(ktActivation);
        };
        void run();
    }, [featureFlag, appName, getMailSettings]);

    return ktActivation;
};

export default useKTActivation;
