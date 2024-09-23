import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useLocalState, useSubscription } from '@proton/components/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    DRIVE_SHORT_APP_NAME,
    DRIVE_UPSELL_PATHS,
    MAIL_SHORT_APP_NAME,
    PRODUCT_BIT,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import type { UserModel } from '@proton/shared/lib/interfaces';
import {
    SpaceState,
    getAppStorage,
    getAppStorageAlmostFull,
    getAppStorageFull,
    getCanAddStorage,
    getCompleteSpaceDetails,
    getPlanToUpsell,
    getSpace,
} from '@proton/shared/lib/user/storage';

import { useUser } from '../../../hooks/useUser';
import upsellStorageDrive from './upsell-storage-drive-full.svg';
import upsellStorageMail from './upsell-storage-mail.svg';

interface Props {
    app: APP_NAMES;
}

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-sidebar-storage-upsell';

const getDriveFull = () => {
    return {
        icon: upsellStorageDrive,
        description: getAppStorageFull(getAppStorage(DRIVE_SHORT_APP_NAME)),
        info: c('storage_split: info')
            .t`To continue uploading and syncing files, free up space or upgrade for more storage.`,
    };
};
const getBaseFull = () => {
    return {
        icon: upsellStorageMail,
        description: getAppStorageFull(getAppStorage(MAIL_SHORT_APP_NAME)),
        info: c('storage_split: info').t`To send or receive emails, free up space or upgrade for more storage.`,
    };
};

const getDriveWarning = () => {
    return {
        ...getDriveFull(),
        description: getAppStorageAlmostFull(getAppStorage(DRIVE_SHORT_APP_NAME)),
    };
};

const getBaseWarning = () => {
    return {
        ...getBaseFull(),
        description: getAppStorageAlmostFull(getAppStorage(MAIL_SHORT_APP_NAME)),
    };
};

const getStorageUpsell = ({ app, user }: { app: APP_NAMES; user: UserModel }) => {
    const space = getSpace(user);

    if (!space.splitStorage) {
        return null;
    }

    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app });

    if (details.drive.type === SpaceState.Danger && details.base.type === SpaceState.Danger) {
        const result = app === APPS.PROTONDRIVE ? getDriveFull() : getBaseFull();
        return {
            ...result,
            plan,
        };
    }

    if (details.drive.type === SpaceState.Danger) {
        return {
            ...getDriveFull(),
            plan,
        };
    }

    if (details.base.type === SpaceState.Danger) {
        return {
            ...getBaseFull(),
            plan,
        };
    }

    if (details.drive.type === SpaceState.Warning && details.base.type === SpaceState.Warning) {
        const result = app === APPS.PROTONDRIVE ? getDriveWarning() : getBaseWarning();
        return {
            ...result,
            plan,
        };
    }

    if (details.drive.type === SpaceState.Warning) {
        return {
            ...getDriveWarning(),
            plan,
        };
    }

    if (details.base.type === SpaceState.Warning) {
        return {
            ...getBaseWarning(),
            plan,
        };
    }

    return null;
};

const SidebarStorageUpsell = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useLocalState(false, `${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`);

    if (!getCanAddStorage({ user, subscription })) {
        return null;
    }

    // Storage upsell is completely hidden in drive.
    const data = app === APPS.PROTONDRIVE ? undefined : getStorageUpsell({ app, user });

    const upsellButton = (
        <ButtonLike
            className="my-2 w-full flex gap-2 items-center justify-center"
            as={SettingsLink}
            color="norm"
            shape="outline"
            path={addUpsellPath(
                getUpgradePath({ user, plan: data?.plan }),
                getUpsellRefFromApp({
                    app,
                    feature: DRIVE_UPSELL_PATHS.SIDEBAR,
                    component: UPSELL_COMPONENT.BUTTON,
                })
            )}
        >
            <Icon name="cloud" />
            {c('Storage').t`Get more storage`}
        </ButtonLike>
    );

    if (!data) {
        const hasDriveSpecificUpsell =
            // Drive specific upsell if subscribed to a drive plan or free plan.
            app === APPS.PROTONDRIVE && (user.Subscribed === PRODUCT_BIT.DRIVE || user.Subscribed === 0);
        if (hasDriveSpecificUpsell) {
            return upsellButton;
        }
        return null;
    }

    if (ignoreStorageLimit) {
        return null;
    }

    return (
        <div className="p-4 pt-3">
            <div className="mb-2 flex justify-space-between">
                <img src={data.icon} alt="" />
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={() => {
                        setIgnoreStorageLimit(true);
                    }}
                >
                    <Icon size={3} name="cross-big" />
                </Button>
            </div>
            <div className="text-bold">{data.description}</div>
            <div className="color-weak">{data.info}</div>
            <div>{upsellButton}</div>
        </div>
    );
};

export default SidebarStorageUpsell;
