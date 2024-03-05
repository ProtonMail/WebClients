import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

const { ADMIN, WRITE, READ, SUPER_ADMIN, EXEC } = SHARE_MEMBER_PERMISSIONS;

export const MEMBER_PERMISSIONS = {
    OWNS: EXEC + READ + WRITE + ADMIN + SUPER_ADMIN,
    VIEWER: READ,
    EDITOR: WRITE + READ,
    ADMIN_EDITOR: WRITE + READ + ADMIN,
};

export const getCanWrite = (permissions: SHARE_MEMBER_PERMISSIONS) => {
    return hasBit(permissions, WRITE);
};
