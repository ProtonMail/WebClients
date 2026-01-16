import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';

import { KtFeatureEnum, isKTActive } from '../shared/ktStatus';

export const getKTFlag = ({ logOnly, showUI }: { logOnly: boolean; showUI: boolean }): KtFeatureEnum => {
    if (showUI) {
        return KtFeatureEnum.ENABLE_UI;
    }
    if (logOnly) {
        return KtFeatureEnum.ENABLE_CORE;
    }
    return KtFeatureEnum.DISABLE;
};

export const getKTActivationValue = async ({
    featureFlag,
    mailSettings,
}: {
    featureFlag: KtFeatureEnum;
    appName: APP_NAMES;
    mailSettings?: MailSettings;
}): Promise<KeyTransparencyActivation> => {
    if (!featureFlag) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (!(await isKTActive(featureFlag))) {
        return KeyTransparencyActivation.DISABLED;
    }
    if (featureFlag == KtFeatureEnum.ENABLE_CORE) {
        return KeyTransparencyActivation.LOG_ONLY;
    }
    if (featureFlag == KtFeatureEnum.ENABLE_UI) {
        if (mailSettings?.KT === KEY_TRANSPARENCY_SETTING.ENABLED) {
            return KeyTransparencyActivation.SHOW_UI;
        } else {
            return KeyTransparencyActivation.LOG_ONLY;
        }
    }
    return KeyTransparencyActivation.DISABLED;
};

export const getKTActivationValueFromFlags = ({
    logOnly,
    showUI,
    appName,
}: {
    logOnly: boolean;
    showUI: boolean;
    appName: APP_NAMES;
}) => {
    return getKTActivationValue({ featureFlag: getKTFlag({ logOnly, showUI }), appName });
};
