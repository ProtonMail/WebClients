export const EASY_SWITCH_LIGHT_USAGE_STORAGE_THRESHOLD = 1024 ** 3; // 1GB
export const EASY_SWITCH_NEW_USER_ACCOUNT_AGE_DAYS = 30;
const EASY_SWITCH_ROLLOUT_WINDOW_DAYS = 15;

/**
 * Who the sidebar entry is shown to, which decides how it is presented.
 * Existing users only see it during the 15 day rollout window (the flag), new users
 * during the 15 days that follow their own volume creation.
 */
export enum EasySwitchUserType {
    /** First use of Drive, once they uploaded something to My Files. */
    NewUser = 'new-user',
    /** Existing user under 1GB used, or with a single item in My Files root. */
    LowUsageUser = 'low-usage',
    /** Existing user over 1GB used with several items in My Files root */
    HighUsageUser = 'high-usage',
}

export interface EasySwitchSidebarUserInfoInput {
    isRolloutActive: boolean;
    isNewUser: boolean;
    rootItemCount: number;
    rootAgeDays: number;
    usedDriveSpace: number;
}

export interface EasySwitchSidebarUserInfo {
    /** `null` means the entry is hidden. */
    userType: EasySwitchUserType | null;
    showNewBadge: boolean;
}

export const NO_USER_INFO: EasySwitchSidebarUserInfo = { userType: null, showNewBadge: false };

/**
 * New users get a per-account window (rootAgeDays, from their My Files root/volume creation)
 * that isn't affected by the rollout flag, only the "new" badge is. Existing users are only
 * shown while the flag is on, split into a low/high usage user type.
 */
export const getEasySwitchSidebarUserType = ({
    isRolloutActive,
    isNewUser,
    rootItemCount,
    rootAgeDays,
    usedDriveSpace,
}: EasySwitchSidebarUserInfoInput): EasySwitchSidebarUserInfo => {
    if (isNewUser) {
        const isWithinWindow = rootItemCount >= 1 && rootAgeDays <= EASY_SWITCH_ROLLOUT_WINDOW_DAYS;
        return isWithinWindow ? { userType: EasySwitchUserType.NewUser, showNewBadge: isRolloutActive } : NO_USER_INFO;
    }

    if (!isRolloutActive) {
        return NO_USER_INFO;
    }

    const isLowUsage = usedDriveSpace < EASY_SWITCH_LIGHT_USAGE_STORAGE_THRESHOLD || rootItemCount <= 1;

    return {
        userType: isLowUsage ? EasySwitchUserType.LowUsageUser : EasySwitchUserType.HighUsageUser,
        showNewBadge: true,
    };
};
