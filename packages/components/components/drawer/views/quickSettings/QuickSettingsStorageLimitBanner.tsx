import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import {
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import {
    SpaceState,
    getAppStorage,
    getAppStorageFull,
    getCanAddStorage,
    getCompleteSpaceDetails,
    getPercentageFull,
    getPlanToUpsell,
    getSpace,
    getStorageFull,
} from '@proton/shared/lib/user/storage';

import DrawerAppSection from '../shared/DrawerAppSection';

const getTitle = (details: ReturnType<typeof getCompleteSpaceDetails>) => {
    if (details.base.type === SpaceState.Danger && details.drive.type === SpaceState.Danger) {
        return getStorageFull();
    }
    if (details.base.type === SpaceState.Danger) {
        return getAppStorageFull(getAppStorage(MAIL_SHORT_APP_NAME));
    }
    if (details.drive.type === SpaceState.Danger) {
        return getAppStorageFull(getAppStorage(DRIVE_SHORT_APP_NAME));
    }
    if (details.base.type === SpaceState.Warning) {
        return getPercentageFull(getAppStorage(MAIL_SHORT_APP_NAME), details.base.displayed);
    }
    if (details.drive.type === SpaceState.Warning) {
        return getPercentageFull(getAppStorage(DRIVE_SHORT_APP_NAME), details.drive.displayed);
    }
    return null;
};

const QuickSettingsStorageLimitBanner = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const space = getSpace(user);
    const { APP_NAME } = useConfig();

    if (!space.splitStorage || !getCanAddStorage({ user, subscription })) {
        return null;
    }

    const details = getCompleteSpaceDetails(space);
    const title = getTitle(details);

    if (!title) {
        return null;
    }

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.BANNER,
    });

    const plan = getPlanToUpsell({ storageDetails: details, app: APP_NAME });

    return (
        <DrawerAppSection>
            <ButtonLike
                as={SettingsLink}
                shape="ghost"
                fullWidth
                className="py-2 px-3"
                path={addUpsellPath(getUpgradePath({ user, subscription, plan }), upsellRef)}
            >
                <div className="flex gap-2">
                    <div className="shrink-0">
                        <Icon name="exclamation-circle-filled" className="color-danger" />
                    </div>
                    <div className="flex-1 text-left">{title}</div>
                </div>
            </ButtonLike>
        </DrawerAppSection>
    );
};

export default QuickSettingsStorageLimitBanner;
