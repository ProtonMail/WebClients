import { PERMISSIONS } from '../constants';

export const hasPermission = (
    userPermissions: PERMISSIONS[],
    pagePermissions: PERMISSIONS[] = [],
    sectionPermissions: PERMISSIONS[] = []
) => {
    const requirements = pagePermissions.concat(sectionPermissions);

    if (!requirements.length) {
        return true;
    }

    return requirements.every((permission) => {
        return userPermissions.includes(permission);
    });
};
