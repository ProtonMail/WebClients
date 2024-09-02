import cloneDeep from 'lodash/cloneDeep';

import { type User, type UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

const user: User = {
    ID: 'xIX_7M6gjqSLamip-a6Qtw6UCuiPQbljnFstr-MNpjP6HihRMNo7troVj-ge6Myv0HWDcpsezWvVUL9C5IKN7A==',
    Name: 'testusermock',
    Currency: 'USD',
    Credit: 0,
    Type: 1,
    CreateTime: 1722504920,
    MaxUpload: 26214400,
    MaxSpace: 524288000,
    MaxBaseSpace: 524288000,
    MaxDriveSpace: 2147483648,
    UsedSpace: 0,
    UsedBaseSpace: 0,
    UsedDriveSpace: 0,
    ProductUsedSpace: {
        Calendar: 0,
        Contact: 0,
        Drive: 0,
        Mail: 0,
        Pass: 0,
    },
    Subscribed: 4,
    Services: 5,
    MnemonicStatus: 1,
    Role: 2,
    Private: 1,
    Delinquent: 0,
    Billed: 0 as any,
    NumAI: 0,
    Keys: [],
    ToMigrate: 0,
    Email: 'testusermock@proton.me',
    DisplayName: 'testusermock',
    AccountRecovery: null,
    Flags: {
        protected: false,
        'drive-early-access': false,
        'onboard-checklist-storage-granted': false,
        'has-temporary-password': false,
        'test-account': false,
        'no-login': false,
        'recovery-attempt': false,
        sso: false,
        'no-proton-address': false,
    },
    ChargebeeUser: 0,
    ChargebeeUserExists: 0,
    DriveEarlyAccess: 0,
    Idle: 0,
};

const userMock: UserModel = formatUser(user);

export function getUserMock(user?: Partial<UserModel>) {
    return { ...cloneDeep(userMock), ...user };
}
