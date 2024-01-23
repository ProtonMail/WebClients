import { c } from 'ttag';

import useFlag from '@proton/components/containers/unleash/useFlag';
import { APPS, APP_NAMES, PLANS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { SpaceState, getCompleteSpaceDetails, getSpace } from '@proton/shared/lib/user/storage';

import { SettingsLink } from '../../components';
import { useConfig, useLocalState, useSubscription, useUser } from '../../hooks';
import TopBanner from './TopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

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
}: {
    user: UserModel;
    subscription: Subscription | undefined;
    percentage: number;
    mode: 'mail' | 'drive';
    upsellRef: string | undefined;
    plan: PLANS;
}) => {
    const upgrade = user.canPay ? (
        <SettingsLink
            key="storage-link"
            className="color-inherit"
            path={addUpsellPath(getUpgradePath({ user, plan, subscription }), upsellRef)}
        >
            {c('storage_split: info').t`upgrade for more storage`}
        </SettingsLink>
    ) : (
        c('storage_split: info').t`contact your administrator`
    );

    if (mode === 'drive') {
        if (percentage >= 100) {
            // Translator: Your drive is almost full. To upload or sync files, free up space or upgrade for more storage.
            return c('storage_split: info')
                .jt`Your drive is full. To upload or sync files, free up space or ${upgrade}.`;
        }
        // Translator: Your drive is 99% full. To upload or sync files, free up space or upgrade for more storage.
        return c('storage_split: info')
            .jt`Your drive is ${percentage}% full. To upload or sync files, free up space or ${upgrade}.`;
    }

    if (percentage >= 100) {
        // Translator: Your storage is full. To send or receive emails, free up space or upgrade for more storage.
        return c('storage_split: info')
            .jt`Your storage is full. To send or receive emails, free up space or ${upgrade}.`;
    }
    // Translator: Your storage is X% full. To send or receive emails, free up space or upgrade for more storage.
    return c('storage_split: info')
        .jt`Your storage is ${percentage}% full. To send or receive emails, free up space or ${upgrade}.`;
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

    if (details.base.type === SpaceState.Danger && details.drive.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan: PLANS.BUNDLE,
                    user,
                    subscription,
                    percentage: app === APPS.PROTONDRIVE ? details.drive.displayed : details.base.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (details.base.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan: PLANS.MAIL,
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
                    plan: PLANS.DRIVE,
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
                    plan: PLANS.BUNDLE,
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
                    plan: PLANS.DRIVE,
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
                    plan: PLANS.MAIL,
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
    const data = getCompleteSpaceDetails(space);

    if (data.pooled.type === SpaceState.Danger) {
        return (
            <TopBanner className="bg-danger">
                {getStorageFull({
                    plan: PLANS.BUNDLE,
                    user,
                    subscription,
                    percentage: data.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    if (ignoreStorageLimit) {
        return null;
    }

    if (data.pooled.type === SpaceState.Warning) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>
                {getStorageFull({
                    plan: PLANS.BUNDLE,
                    user,
                    subscription,
                    percentage: data.pooled.displayed,
                    mode: app === APPS.PROTONDRIVE ? 'drive' : 'mail',
                    upsellRef,
                })}
            </TopBanner>
        );
    }

    return null;
};

const StorageLimitTopBanner = ({ app }: Props) => {
    const storageSplitEnabled = useFlag('SplitStorage');
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useLocalState(false, `${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`);
    const space = getSpace(user, storageSplitEnabled);

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: app,
    });

    return space.splitStorage && storageSplitEnabled ? (
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
