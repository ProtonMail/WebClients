import { useEffect, useState } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KeyTransparencyActivation, MailSettings } from '@proton/shared/lib/interfaces';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';

import useFlag from '../../containers/unleash/useFlag';
import { useAuthentication, useConfig, useGetMailSettings } from '../../hooks';
import { KtFeatureEnum, isKTActive } from './ktStatus';

const getKTFlag = ({ logOnly, showUI }: { logOnly: boolean; showUI: boolean }): KtFeatureEnum => {
    if (showUI) {
        return KtFeatureEnum.ENABLE_UI;
    }
    if (logOnly) {
        return KtFeatureEnum.ENABLE_CORE;
    }
    return KtFeatureEnum.DISABLE;
};

const getKTActivation = (
    featureFlag: KtFeatureEnum,
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

const useKTActivation = (): KeyTransparencyActivation => {
    const { APP_NAME: appName } = useConfig();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const showUI = useFlag('KeyTransparencyShowUI');
    const logOnly = useFlag('KeyTransparencyLogOnly');
    const [ktActivation, setKTActivation] = useState(KeyTransparencyActivation.DISABLED);
    const getMailSettings = useGetMailSettings();

    useEffect(() => {
        const run = async () => {
            const featureFlag = getKTFlag({ logOnly, showUI });
            const mailSettings = isAuthenticated ? await getMailSettings() : undefined;
            const ktActivation = getKTActivation(featureFlag, appName, mailSettings);
            setKTActivation(ktActivation);
        };
        void run();
    }, [showUI, logOnly, appName, isAuthenticated, getMailSettings]);

    return ktActivation;
};

export default useKTActivation;
