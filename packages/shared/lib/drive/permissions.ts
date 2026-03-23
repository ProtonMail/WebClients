import { hasBit } from '@proton/shared/lib/helpers/bitset';

export enum DRIVE_PERMISSIONS {
    READ = 4,
    WRITE = 2,
    ADMIN = 16,
}

const { READ, WRITE, ADMIN } = DRIVE_PERMISSIONS;

export enum SHARE_URL_PERMISSIONS {
    VIEWER = READ,
    EDITOR = WRITE + READ,
}

export enum SHARE_MEMBER_PERMISSIONS {
    VIEWER = READ,
    EDITOR = WRITE + READ,
    ADMIN_EDITOR = WRITE + READ + ADMIN,
}

export const getCanWrite = (permissions: SHARE_MEMBER_PERMISSIONS | SHARE_URL_PERMISSIONS) => {
    return hasBit(permissions, DRIVE_PERMISSIONS.WRITE);
};

export const getCanAdmin = (permissions: SHARE_MEMBER_PERMISSIONS) => {
    return hasBit(permissions, DRIVE_PERMISSIONS.ADMIN);
};
