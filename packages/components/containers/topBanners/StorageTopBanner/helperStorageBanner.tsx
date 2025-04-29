import type { ReactNode } from 'react';

import { c } from 'ttag';

import {
    APPS,
    type APP_NAMES,
    BRAND_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getAppStorage } from '@proton/shared/lib/user/storage';

const getStr = (percentage: number, storage: ReactNode, cta: ReactNode) => {
    if (percentage >= 100) {
        // Translator: Your Drive storage is full. To upload or sync files, free up space or upgrade for more storage.
        return c('storage_split: info').jt`Your ${storage} is full. ${cta}.`;
    }
    // Translator: Your Drive storage is 99% full. To upload or sync files, free up space or upgrade for more storage.
    return c('storage_split: info').jt`Your ${storage} is ${percentage}% full. ${cta}.`;
};

const getStrFull = (percentage: number, storage: ReactNode, cta: ReactNode) => {
    if (percentage >= 100) {
        // Translator: Your storage is full. To upload or sync files, free up space or upgrade for more storage.
        return c('storage_split: info').jt`Your storage is full. ${cta}.`;
    }
    // Translator: Your storage is 99% full. To upload or sync files, free up space or upgrade for more storage.
    return c('storage_split: info').jt`Your storage is ${percentage}% full. ${cta}.`;
};

export const getStorageFull = ({
    percentage,
    mode,
    app,
    upgrade,
}: {
    percentage: number;
    mode: 'mail' | 'drive' | 'both';
    app?: APP_NAMES;
    upgrade: ReactNode;
}): ReactNode => {
    const driveCta = c('storage_split: info').jt`To upload or sync files, free up space or ${upgrade}`;
    const mailCta = c('storage_split: info').jt`To continue using ${BRAND_NAME} products, free up space or ${upgrade}`;

    if (mode === 'drive') {
        return getStr(percentage, getAppStorage(DRIVE_SHORT_APP_NAME), driveCta);
    }
    if (mode === 'mail') {
        return getStr(percentage, getAppStorage(MAIL_SHORT_APP_NAME), mailCta);
    }
    if (mode === 'both') {
        if (app === APPS.PROTONDRIVE) {
            return getStrFull(percentage, getAppStorage(DRIVE_SHORT_APP_NAME), driveCta);
        }
        return getStrFull(percentage, getAppStorage(DRIVE_SHORT_APP_NAME), mailCta);
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
