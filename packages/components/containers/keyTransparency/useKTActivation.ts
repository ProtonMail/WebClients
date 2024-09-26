import { useCallback, useEffect, useState } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { useFlag, useGetFlag } from '@proton/unleash';

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

export const useGetKTActivation = (): (() => Promise<KeyTransparencyActivation>) => {
    const { APP_NAME: appName } = useConfig();
    const authentication = useAuthentication();
    const getMailSettings = useGetMailSettings();
    const getFlag = useGetFlag();

    return useCallback(async () => {
        const logOnly = getFlag('KeyTransparencyLogOnly');
        const showUI = getFlag('KeyTransparencyShowUI');
        const featureFlag = getKTFlag({ logOnly, showUI });
        const mailSettings = Boolean(authentication.UID) ? await getMailSettings() : undefined;
        return getKTActivation(featureFlag, appName, mailSettings);
    }, []);
};

const useKTActivation = (): KeyTransparencyActivation => {
    const showUI = useFlag('KeyTransparencyShowUI');
    const logOnly = useFlag('KeyTransparencyLogOnly');
    const getKTActivation = useGetKTActivation();
    const [ktActivation, setKTActivation] = useState(KeyTransparencyActivation.DISABLED);

    useEffect(() => {
        const run = async () => {
            setKTActivation(await getKTActivation());
        };
        void run();
    }, [showUI, logOnly]);

    return ktActivation;
};

export default useKTActivation;
