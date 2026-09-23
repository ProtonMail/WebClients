import {
    type EasySwitchSidebarUserInfo,
    type EasySwitchSidebarUserInfoInput,
    EasySwitchUserType,
    EASY_SWITCH_LIGHT_USAGE_STORAGE_THRESHOLD as LIGHT_THRESHOLD,
    NO_USER_INFO,
    getEasySwitchSidebarUserType,
} from './getEasySwitchSidebarUserType';

// An existing user with heavy usage and the rollout on.
const baseInput: EasySwitchSidebarUserInfoInput = {
    isRolloutActive: true,
    isNewUser: false,
    rootItemCount: 3,
    rootAgeDays: 400,
    usedDriveSpace: LIGHT_THRESHOLD * 2,
};

const cases: [string, Partial<EasySwitchSidebarUserInfoInput>, EasySwitchSidebarUserInfo][] = [
    ['new user, nothing uploaded yet', { isNewUser: true, rootAgeDays: 1, rootItemCount: 0 }, NO_USER_INFO],
    [
        'new user, 15 days after root creation',
        { isNewUser: true, rootAgeDays: 15 },
        { userType: EasySwitchUserType.NewUser, showNewBadge: true },
    ],
    ['new user, 16 days after root creation', { isNewUser: true, rootAgeDays: 16 }, NO_USER_INFO],
    [
        'new user, rollout off',
        { isNewUser: true, rootAgeDays: 1, isRolloutActive: false },
        { userType: EasySwitchUserType.NewUser, showNewBadge: false },
    ],
    ['existing user, rollout off', { isRolloutActive: false }, NO_USER_INFO],
    [
        'existing user under the storage threshold',
        { usedDriveSpace: LIGHT_THRESHOLD - 1 },
        { userType: EasySwitchUserType.LowUsageUser, showNewBadge: true },
    ],
    [
        'existing user with a single root item',
        { rootItemCount: 1 },
        { userType: EasySwitchUserType.LowUsageUser, showNewBadge: true },
    ],
    [
        'existing user above the threshold with several items',
        {},
        { userType: EasySwitchUserType.HighUsageUser, showNewBadge: true },
    ],
];

describe('getEasySwitchSidebarUserType', () => {
    it.each(cases)('%s', (_, input, expected) => {
        expect(getEasySwitchSidebarUserType({ ...baseInput, ...input })).toEqual(expected);
    });
});
