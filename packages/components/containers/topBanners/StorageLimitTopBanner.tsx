import type { ReactNode } from 'react';

import { c } from 'ttag';

import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { APP_NAMES, PLANS } from '@proton/shared/lib/constants';
import {
    APPS,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import {
    SpaceState,
    getAppStorage,
    getCompleteSpaceDetails,
    getPlanToUpsell,
    getSpace,
} from '@proton/shared/lib/user/storage';
import { useFlag } from '@proton/unleash';

import { LockedStateTopBanner } from '.';
import { useConfig, useLocalState, useSubscription, useUser } from '../../hooks';
import TopBanner from './TopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

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

interface Props {
    app: APP_NAMES;
}

const getStorageFull = ({
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

const SplitStorageLimitTopBanner = ({
    app,
    user,
    subscription,
    upsellRef,
    ignoreStorageLimit,
    setIgnoreStorageLimit,
    space,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription | undefined;
    upsellRef: string | undefined;
    ignoreStorageLimit: boolean;
    setIgnoreStorageLimit: (value: boolean) => void;
    space: ReturnType<typeof getSpace>;
}) => {
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app });

    if (details.base.type === SpaceState.Danger && details.drive.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: 'both',
                    app,
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Danger && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (ignoreStorageLimit) {
        return null;
    }

    if (details.drive.type === SpaceState.Warning && details.base.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.drive.type === SpaceState.Warning && app === APPS.PROTONDRIVE) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.drive.displayed,
                    mode: 'drive',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.base.displayed,
                    mode: 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    return null;
};

const PooledStorageLimitTopBanner = ({
    app,
    user,
    subscription,
    upsellRef,
    ignoreStorageLimit,
    setIgnoreStorageLimit,
    space,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription | undefined;
    upsellRef: string | undefined;
    ignoreStorageLimit: boolean;
    setIgnoreStorageLimit: (value: boolean) => void;
    space: ReturnType<typeof getSpace>;
}) => {
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app });

    if (details.pooled.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (ignoreStorageLimit) {
        return null;
    }

    if (details.pooled.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan,
                    user,
                    subscription,
                    percentage: details.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    return null;
};

const StorageLimitTopBanner = ({ app }: Props) => {
    const lockedStateEnabled = useFlag('LockedState');
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useLocalState(false, `${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`);
    const space = getSpace(user);

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: app,
    });

    if (lockedStateEnabled && user.LockedFlags) {
        return (
            <LockedStateTopBanner
                app={app}
                user={user}
                subscription={subscription}
                upsellRef={upsellRef}
                lockedFlags={user.LockedFlags}
            />
        );
    }

    return space.splitStorage ? (
        <SplitStorageLimitTopBanner
            app={app}
            space={space}
            user={user}
            subscription={subscription}
            upsellRef={upsellRef}
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    ) : (
        <PooledStorageLimitTopBanner
            app={app}
            user={user}
            subscription={subscription}
            space={space}
            upsellRef={upsellRef}
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    );
};

export default StorageLimitTopBanner;
