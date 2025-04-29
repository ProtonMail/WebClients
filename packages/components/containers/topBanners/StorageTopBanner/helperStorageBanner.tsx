import type { ReactNode } from 'react';

import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { PLANS, Subscription } from '@proton/payments';
import { APPS, type APP_NAMES, DRIVE_SHORT_APP_NAME, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import type { UserModel } from '@proton/shared/lib/interfaces';
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
    user,
    subscription,
    percentage,
    mode,
    upsellRef,
    plan,
    app,
}: {
    user: UserModel;
    subscription: Subscription | undefined;
    percentage: number;
    mode: 'mail' | 'drive' | 'both';
    app?: APP_NAMES;
    upsellRef: string | undefined;
    plan: PLANS;
}): ReactNode => {
    const upgrade = user.canPay ? (
        <SettingsLink
            key="storage-link"
            className="color-inherit"
            path={addUpsellPath(getUpgradePath({ user, plan, subscription }), upsellRef)}
        >
            {
                // Translator: To upload or sync files, free up space or upgrade for more storage
                c('storage_split: info').t`upgrade for more storage`
            }
        </SettingsLink>
    ) : (
        // Translator: To upload or sync files, contact your administrator
        c('storage_split: info').t`contact your administrator`
    );

    const driveCta = c('storage_split: info').jt`To upload or sync files, free up space or ${upgrade}`;
    const mailCta = c('storage_split: info').jt`To send or receive emails, free up space or ${upgrade}`;

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
