import type { ReactNode } from 'react';

import { c } from 'ttag';

import {
    type APP_NAMES,
    BRAND_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getAppStorage } from '@proton/shared/lib/user/storage';

const getStorageMessageWithProduct = (percentage: number, productString: ReactNode, cta: ReactNode) => {
    if (percentage >= 100) {
        // Translator: Your Drive storage is full. To upload or sync files, free up space or upgrade for more storage.
        return c('storage_split: info').jt`Your ${productString} is full. ${cta}.`;
    }
    // Translator: Your Drive storage is 99% full. To upload or sync files, free up space or upgrade for more storage.
    return c('storage_split: info').jt`Your ${productString} is ${percentage}% full. ${cta}.`;
};

const getGenericStorageMessage = (percentage: number, cta: ReactNode) => {
    if (percentage >= 100) {
        // Translator: Your storage is full. To upload or sync files, free up space or upgrade for more storage.
        return c('storage_split: info').jt`Your storage is full. ${cta}.`;
    }
    // Translator: Your storage is 99% full. To upload or sync files, free up space or upgrade for more storage.
    return c('storage_split: info').jt`Your storage is ${percentage}% full. ${cta}.`;
};

export const getPooledStorageBannerText = ({
    percentage,
    upgrade,
}: {
    percentage: number;
    upgrade: ReactNode;
}): ReactNode => {
    const genericSuffix = c('storage_split: info')
        .jt`To continue using ${BRAND_NAME} products, free up space or ${upgrade}`;

    return getGenericStorageMessage(percentage, genericSuffix);
};

export const getSplitStorageBannerText = ({
    percentage,
    mode,
    upgrade,
}: {
    percentage: number;
    mode: 'mail' | 'drive' | 'both';
    upgrade: ReactNode;
}): ReactNode => {
    const driveCopy = c('storage_split: info').jt`To upload or sync files, free up space or ${upgrade}`;
    const mailCopy = c('storage_split: info').jt`To send or receive emails, free up space or ${upgrade}`;

    if (mode === 'drive') {
        return getStorageMessageWithProduct(percentage, getAppStorage(DRIVE_SHORT_APP_NAME), driveCopy);
    }

    if (mode === 'mail') {
        return getStorageMessageWithProduct(percentage, getAppStorage(MAIL_SHORT_APP_NAME), mailCopy);
    }

    if (mode === 'both') {
        const bothCopy = c('storage_split: info')
            .jt`To continue using ${BRAND_NAME} products, free up space or ${upgrade}`;

        return getGenericStorageMessage(percentage, bothCopy);
    }
};

export const getStorageUpsell = (app: APP_NAMES) => {
    return getUpsellRefFromApp({
        app,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: app,
    });
};
