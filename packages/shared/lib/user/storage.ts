import { c } from 'ttag';

import { PLANS, type Subscription, getHasMailB2BPlan, hasVisionary } from '@proton/payments';

import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import type { User, UserModel } from '../interfaces';

export const getHasStorageSplit = (user: User) => {
    return user.MaxBaseSpace !== undefined;
};

export const getUsedSpace = (user: User) => {
    if (getHasStorageSplit(user)) {
        return user.UsedBaseSpace + user.UsedDriveSpace;
    }
    return user.UsedSpace;
};

export const getSpace = (user: User) => {
    const usedSpace = user.UsedSpace ?? 0;
    const maxSpace = user.MaxSpace ?? 0;

    if (!getHasStorageSplit(user)) {
        const usedDriveSpace = user.ProductUsedSpace?.Drive ?? 0;
        const usedBaseSpace = usedSpace - usedDriveSpace;
        return {
            usedSpace,
            usedBaseSpace,
            usedDriveSpace,
            maxSpace,
            maxBaseSpace: maxSpace,
            maxDriveSpace: maxSpace,
            splitStorage: false,
        };
    }

    const usedDriveSpace = user.UsedDriveSpace ?? 0;
    const usedBaseSpace = user.UsedBaseSpace ?? 0;
    const maxDriveSpace = user.MaxDriveSpace ?? maxSpace ?? 0;
    const maxBaseSpace = user.MaxBaseSpace ?? maxSpace ?? 0;

    return {
        usedSpace,
        usedBaseSpace,
        usedDriveSpace,
        maxSpace,
        maxBaseSpace,
        maxDriveSpace,
        splitStorage: true,
    };
};
const getData = (used: number, max: number) => {
    const percentage = (used * 100) / max;
    const safePercentage = Number.isNaN(percentage) ? 0 : percentage;
    const flooredPercentage = Math.floor(safePercentage);
    return {
        percentage: safePercentage,
        displayed: flooredPercentage,
    };
};

export enum SpaceState {
    Good,
    Warning,
    Danger,
}

export const getSpaceDetails = (usedSpace: number, maxSpace: number) => {
    const data = getData(usedSpace, maxSpace);
    const danger = data.percentage >= 100;
    const warning = data.percentage >= 80 && data.percentage < 100;
    return {
        type: danger ? SpaceState.Danger : warning ? SpaceState.Warning : SpaceState.Good,
        ...data,
    };
};

export const getCompleteSpaceDetails = (space: ReturnType<typeof getSpace>) => {
    return {
        pooled: getSpaceDetails(space.usedSpace, space.maxSpace),
        base: getSpaceDetails(space.usedBaseSpace, space.maxBaseSpace),
        drive: getSpaceDetails(space.usedDriveSpace, space.maxDriveSpace),
    };
};

export const getAppSpace = (options: ReturnType<typeof getSpace>, app: APP_NAMES) => {
    if (!options.splitStorage) {
        return { usedSpace: options.usedSpace, maxSpace: options.maxSpace };
    }
    if (app === APPS.PROTONDRIVE || app === APPS.PROTONDOCS) {
        return { usedSpace: options.usedDriveSpace, maxSpace: options.maxDriveSpace };
    }
    return { usedSpace: options.usedBaseSpace, maxSpace: options.maxBaseSpace };
};

export const getCanAddStorage = ({ user, subscription }: { user: UserModel; subscription?: Subscription }) => {
    if (!subscription) {
        return false;
    }
    if (!user.isSelf) {
        return false;
    }
    if (user.isMember) {
        return false;
    }
    if (!user.canPay) {
        return false;
    }
    if (hasVisionary(subscription) || getHasMailB2BPlan(subscription)) {
        return false;
    }
    return true;
};

export const getAppStorage = (app: string) => {
    // Translator: Your 'mail storage' or 'drive storage' is full
    return c('storage_split: info').t`${app} storage`;
};

export const getAppStorageFull = (appStorage: string) => {
    // Translator: Your 'mail storage' or 'drive storage' is full
    return c('storage_split: info').t`Your ${appStorage} is full`;
};

export const getAppStorageAlmostFull = (appStorage: string) => {
    return c('storage_split: info').t`Your ${appStorage} is almost full`;
};

export const getStorageFull = () => {
    return c('storage_split: info').t`Your storage is full`;
};

export const getPercentageFull = (storage: string, percentage: number) => {
    // Translator: Drive storage 99% full
    return c('storage_split: info').t`${storage} ${percentage}% full`;
};

export const getPlanToUpsell = ({
    storageDetails,
    app,
}: {
    storageDetails: ReturnType<typeof getCompleteSpaceDetails>;
    app: APP_NAMES;
}) => {
    if (app === APPS.PROTONDRIVE) {
        return PLANS.DRIVE;
    }

    // Area of experimentation which plan to upsell to.
    if (false) {
        if (storageDetails.base.type === SpaceState.Danger && storageDetails.drive.type === SpaceState.Danger) {
            return PLANS.BUNDLE;
        }
        if (storageDetails.base.type === SpaceState.Danger) {
            return PLANS.MAIL;
        }
        if (storageDetails.drive.type === SpaceState.Danger) {
            return PLANS.DRIVE;
        }
    }

    return PLANS.MAIL;
};
